﻿using System.Web;
using System.Web.Optimization;

namespace Sandbox
{
    public class BundleConfig
    {
        // For more information on Bundling, visit http://go.microsoft.com/fwlink/?LinkId=254725
        public static void RegisterBundles(BundleCollection bundles)
        {
            bundles.Add(new ScriptBundle("~/bundles/jquery").Include("~/Scripts/jquery-{version}.js"));
            bundles.Add(new ScriptBundle("~/bundles/bootstrap").Include("~/Scripts/bootstrap.js"));
            bundles.Add(new ScriptBundle("~/bundles/knockout").Include("~/Scripts/knockout-{version}.js", "~/Scripts/knockout-addons.js"));
            
            bundles.Add(new StyleBundle("~/Content/css").Include("~/Content/site.css"));
            bundles.Add(new StyleBundle("~/Content/bootstrap").Include("~/Content/Bootstrap/css/bootstrap.css", "~/Content/Bootstrap/css/bootstrap-responsive.css"));
            bundles.Add(new StyleBundle("~/Content/knockoutaddons").Include("~/Content/knockout-addons.css"));
        }
    }
}