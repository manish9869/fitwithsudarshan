// src/pages/admin/diet/dietRegions.js
//
// India's regional cuisines — lets an admin filter the food library and
// browse foods matching a specific client's cultural background (e.g. only
// Gujarati dishes for a Gujarati client) instead of one flat 1000+ item
// list. Kept as a fixed frontend list (like SERVING_UNITS) rather than a
// separate DB table since it's a closed, rarely-changing set.
export const FOOD_REGIONS = [
    'Generic / Pan-Indian',
    'Punjabi',
    'Gujarati',
    'Maharashtrian',
    'Rajasthani',
    'South Indian',
    'Bengali',
    'Kashmiri',
    'Sindhi',
    'Hyderabadi / Deccani',
    'Goan',
    'Bihari / East Indian',
    'North-Eastern',
    'North Indian',
    'Continental / Other',
];
