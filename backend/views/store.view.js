// The store's details (store_info rows by name) shaped like the storefront's StoreInfo (frontend/src/types/store.ts).
// Only the names listed here are public.
export function storeView(info) {
  return {
    phone: info.phone,
    phoneLink: info.phone_link,
    email: info.email,
    address: info.address,
    gstin: info.gstin,
    indiamartLink: info.indiamart_link,
    whatsappNumber: info.whatsapp_number,
    aboutText: info.about_text,
    supplyTypes: info.supply_types,
    governmentBuyers: info.government_buyers,
    stockPhotos: info.stock_photos,
    categories: info.categories,
    nonMedicalCategory: info.non_medical_category,
    policies: info.policies,
    policiesUpdated: info.policies_updated,
  };
}
