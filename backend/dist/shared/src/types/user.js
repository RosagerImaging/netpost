"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.SubscriptionStatus = exports.SubscriptionTier = void 0;
var SubscriptionTier;
(function (SubscriptionTier) {
    SubscriptionTier["TRIAL"] = "trial";
    SubscriptionTier["STARTER"] = "starter";
    SubscriptionTier["PROFESSIONAL"] = "professional";
    SubscriptionTier["ENTERPRISE"] = "enterprise";
})(SubscriptionTier || (exports.SubscriptionTier = SubscriptionTier = {}));
var SubscriptionStatus;
(function (SubscriptionStatus) {
    SubscriptionStatus["ACTIVE"] = "active";
    SubscriptionStatus["PAST_DUE"] = "past_due";
    SubscriptionStatus["CANCELED"] = "canceled";
    SubscriptionStatus["TRIALING"] = "trialing";
    SubscriptionStatus["INCOMPLETE"] = "incomplete";
})(SubscriptionStatus || (exports.SubscriptionStatus = SubscriptionStatus = {}));
