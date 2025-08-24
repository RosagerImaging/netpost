"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.TaxDocumentType = exports.AnalyticsPeriod = void 0;
var AnalyticsPeriod;
(function (AnalyticsPeriod) {
    AnalyticsPeriod["DAILY"] = "daily";
    AnalyticsPeriod["WEEKLY"] = "weekly";
    AnalyticsPeriod["MONTHLY"] = "monthly";
    AnalyticsPeriod["QUARTERLY"] = "quarterly";
    AnalyticsPeriod["YEARLY"] = "yearly";
})(AnalyticsPeriod || (exports.AnalyticsPeriod = AnalyticsPeriod = {}));
var TaxDocumentType;
(function (TaxDocumentType) {
    TaxDocumentType["ANNUAL_SUMMARY"] = "annual_summary";
    TaxDocumentType["QUARTERLY_REPORT"] = "quarterly_report";
    TaxDocumentType["FORM_1099"] = "form_1099";
    TaxDocumentType["EXPENSE_REPORT"] = "expense_report";
})(TaxDocumentType || (exports.TaxDocumentType = TaxDocumentType = {}));
