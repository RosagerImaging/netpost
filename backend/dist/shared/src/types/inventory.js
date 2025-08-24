"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.InventoryStatus = exports.ListingStatus = exports.Platform = exports.ItemCondition = void 0;
var ItemCondition;
(function (ItemCondition) {
    ItemCondition["NEW"] = "new";
    ItemCondition["NEW_WITH_TAGS"] = "new_with_tags";
    ItemCondition["NEW_WITHOUT_TAGS"] = "new_without_tags";
    ItemCondition["LIKE_NEW"] = "like_new";
    ItemCondition["EXCELLENT"] = "excellent";
    ItemCondition["GOOD"] = "good";
    ItemCondition["FAIR"] = "fair";
    ItemCondition["POOR"] = "poor";
})(ItemCondition || (exports.ItemCondition = ItemCondition = {}));
var Platform;
(function (Platform) {
    Platform["EBAY"] = "ebay";
    Platform["MERCARI"] = "mercari";
    Platform["POSHMARK"] = "poshmark";
    Platform["FACEBOOK_MARKETPLACE"] = "facebook_marketplace";
    Platform["DEPOP"] = "depop";
    Platform["ETSY"] = "etsy";
})(Platform || (exports.Platform = Platform = {}));
var ListingStatus;
(function (ListingStatus) {
    ListingStatus["ACTIVE"] = "active";
    ListingStatus["SOLD"] = "sold";
    ListingStatus["ENDED"] = "ended";
    ListingStatus["DRAFT"] = "draft";
    ListingStatus["SUSPENDED"] = "suspended";
    ListingStatus["OUT_OF_STOCK"] = "out_of_stock";
})(ListingStatus || (exports.ListingStatus = ListingStatus = {}));
var InventoryStatus;
(function (InventoryStatus) {
    InventoryStatus["ACTIVE"] = "active";
    InventoryStatus["SOLD"] = "sold";
    InventoryStatus["GRAYED_OUT"] = "grayed_out";
    InventoryStatus["DRAFT"] = "draft";
    InventoryStatus["ARCHIVED"] = "archived";
})(InventoryStatus || (exports.InventoryStatus = InventoryStatus = {}));
