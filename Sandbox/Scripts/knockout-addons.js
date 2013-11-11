ko.extenders.ArraySource = function (target, option) {
    target.Source = option.source;
    target.IdField = option.idField ? option.idField : 'id';
    target.NameField = option.nameField ? option.nameField : 'name';
    target.Name = ko.computed({
        read: function () {
            var source = ko.utils.unwrapObservable(option.source);
            var curValue = ko.utils.unwrapObservable(this);

            if (curValue == null || typeof (curValue) == 'undefined') return "N/A";

            for (var i = 0; i < source.length; i++) {
                if (ko.utils.unwrapObservable(source[i][this.IdField]) == curValue) {
                    return ko.utils.unwrapObservable(source[i][this.NameField]);
                }
            }
            return "";
        },
        write: function (newValue) {
            var source = ko.utils.unwrapObservable(option.source);

            for (var i = 0; i < source.length; i++) {
                if (ko.utils.unwrapObservable(source[i][this.NameField]) == newValue) {
                    this(ko.utils.unwrapObservable(source[i][this.IdField]));
                    break;
                }
            }
        },
        owner: target
    });

    return target;
};

ko.bindingHandlers.tableFilter = {
    init: function (element, valueAccessor, allBindings, viewModel, bindingContext) {
        //find the defined header
        var headerRow = $(element).find('thead').find('tr');
        //create a new row to hold the query inputs
        var queryRow = $('<tr class="filter-row">');
        //object to hold any observables built. Used for extending the binding context
        var queryFilterObservables = {};
        //object to hold more properties about each query filter, like algorithm to use, etc.
        var queryFilterProperties = {};
        //the property currently being sorted
        var sorted = ko.observable();
        //loop through header cells in the defined header row
        $(headerRow).find('th').each(function (index, item) {
            //build a new cell for the query input row
            var headercell = $('<th>');
            //check if the cell has a class attribute
            var classAttr = $(item).attr('class');
            if (classAttr) {
                //try to find a class that starts with 'sortable-'
                var classes = classAttr.split(' ');
                for (var i = 0; i < classes.length; i++) {
                    if (classes[i].indexOf('sortable-') == 0) {
                        var splitClass = classes[i].split('-');
                        var propName = splitClass[1];
                        var obsName = '$filter' + propName;

                        var newObservable = ko.observable();
                        //add a new observable to the queryFilterObservables object
                        queryFilterObservables[obsName] = newObservable;
                        //add a new object to the queryFilterProperties object
                        queryFilterProperties[propName] = { observable: newObservable };
                        //if a column type is specified, store it
                        if (splitClass.length > 2) queryFilterProperties[propName].type = splitClass[2];
                        //create the input, bound to the new observable
                        headercell.append('<div class="query-filter-container"><input class="filter-input" type="text" data-bind="value: ' + obsName + '" /></div>');

                        $(item).click(function () {
                            //Remove any other set arrows
                            $(item).parent().find('th').each(function (ind, it) {
                                $(it).removeClass("sortasc");
                                $(it).removeClass("sortdesc");
                            });
                            if (sorted() == propName) {
                                sorted('desc-' + propName);
                                $(item).addClass("sortdesc");
                            } else {
                                sorted(propName);
                                $(item).addClass("sortasc");
                            }
                        });
                    }
                }
            }

            //add the new cell to the query input row
            queryRow.append(headercell);
        });
        //add the query input row to the table
        $(element).find('thead').prepend(queryRow);

        //define the new filtered computed      
        var bindingValue = valueAccessor();
        var obs = (typeof bindingValue === "object") ? bindingValue.source : bindingValue;
        var filtered = ko.computed(function () {
            var result = obs().filter(function (item) {
                //loop through all built query inputs
                for (var prop in queryFilterProperties) {
                    //grab the value from the observable
                    var filterValue = queryFilterProperties[prop].observable();
                    var type = queryFilterProperties[prop].type;
                    //grab the value from the property on the item
                    var itemValue = ko.utils.unwrapObservable(item[prop]);
                    //don't filter this property if nothing was entered
                    if (filterValue) {
                        if (!type) { //no type specified, determine what to use
                            if (!isNaN(itemValue)) type = 'num';
                            else type = 'text';
                        }
                        //if the item value looks like a number, check equality
                        if (type == 'num') {
                            if (itemValue != filterValue) return false;
                        } else if (type == 'text') {
                            if (itemValue.toString().toLowerCase().indexOf(filterValue.toLowerCase()) == -1) return false;
                        }
                    }
                }
                return true;
            });
            //grab the sorted property
            var sortedVal = sorted();
            //don't try to sort if no property is chosen
            if (sortedVal) {
                //determine if the table should be sorted in reverse
                var rev = sortedVal.indexOf('desc-') == 0;
                var prop = sortedVal.substring(sortedVal.indexOf('-') + 1);
                var sortedType = queryFilterProperties[prop].type;
                if (!sortedType) sortedType = 'text';
                result.sort(function (a, b) {
                    //grab the item values
                    var aVal = ko.utils.unwrapObservable(a[prop]);
                    var bVal = ko.utils.unwrapObservable(b[prop]);

                    if (sortedType == 'text') {
                        return rev ? bVal.toString().localeCompare(aVal.toString()) : aVal.toString().localeCompare(bVal.toString());
                    }
                    else {
                        if (aVal < bVal) return rev ? 1 : -1;
                        else if (aVal > bVal) return rev ? -1 : 1;
                        else return 0;
                    }
                });
            }
            return result;
        });

        if (typeof bindingValue === "object" && typeof bindingValue.afterInit === "function") bindingValue.afterInit(filtered);

        //extend the binding context
        var innerBindingContext = bindingContext.extend($.extend({}, queryFilterObservables, { '$filterData': filtered }));
        //apply the new context to the descendants of the table element
        ko.applyBindingsToDescendants(innerBindingContext, element);
        //indicated that knockout should not bind the descendants itself
        return { controlsDescendantBindings: true };
    }
};