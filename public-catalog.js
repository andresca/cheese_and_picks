// The subset of the catalog the storefront sees (GET /api/catalog and the static catalog.json).
function publicCatalog(cat) {
  const s = cat.settings;
  return {
    settings: {
      businessName: s.businessName, currencyCode: s.currencyCode || 'COP', deliveryFee: s.deliveryFee || 0,
      freeDeliveryFrom: s.freeDeliveryFrom || 0, minOrderTotal: s.minOrderTotal || 0, minLeadDays: s.minLeadDays || 0,
      closedWeekdays: s.closedWeekdays || [], deliveryEnabled: s.deliveryEnabled !== false, pickupEnabled: s.pickupEnabled !== false,
    },
    categories: cat.categories,
    sizes: cat.sizes.filter(x => x.active),
    products: cat.products.filter(x => x.active),
  };
}

module.exports = { publicCatalog };
