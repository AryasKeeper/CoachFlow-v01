// Coordinates for Sydney suburbs
// In production, use a proper geocoding service like Google Maps or Mapbox

export const SUBURB_COORDINATES: Record<string, { lat: number; lng: number }> = {
  // Inner City
  'Alexandria': { lat: -33.9111, lng: 151.1943 },
  'Chippendale': { lat: -33.8874, lng: 151.2013 },
  'Darlinghurst': { lat: -33.8789, lng: 151.2217 },
  'Glebe': { lat: -33.8790, lng: 151.1848 },
  'Potts Point': { lat: -33.8673, lng: 151.2255 },
  'Redfern': { lat: -33.8928, lng: 151.2061 },
  'Surry Hills': { lat: -33.8830, lng: 151.2131 },
  'Sydney CBD': { lat: -33.8688, lng: 151.2093 },
  'Ultimo': { lat: -33.8808, lng: 151.1970 },
  'Waterloo': { lat: -33.9001, lng: 151.2063 },

  // Eastern Suburbs
  'Bondi': { lat: -33.8915, lng: 151.2767 },
  'Bondi Beach': { lat: -33.8915, lng: 151.2767 },
  'Bondi Junction': { lat: -33.8924, lng: 151.2478 },
  'Bronte': { lat: -33.9033, lng: 151.2643 },
  'Clovelly': { lat: -33.9130, lng: 151.2592 },
  'Coogee': { lat: -33.9200, lng: 151.2571 },
  'Maroubra': { lat: -33.9497, lng: 151.2447 },
  'Paddington': { lat: -33.8845, lng: 151.2264 },
  'Randwick': { lat: -33.9133, lng: 151.2413 },

  // Inner West
  'Annandale': { lat: -33.8810, lng: 151.1709 },
  'Ashfield': { lat: -33.8890, lng: 151.1265 },
  'Dulwich Hill': { lat: -33.9041, lng: 151.1404 },
  'Erskineville': { lat: -33.9004, lng: 151.1859 },
  'Leichhardt': { lat: -33.8839, lng: 151.1570 },
  'Lilyfield': { lat: -33.8706, lng: 151.1659 },
  'Marrickville': { lat: -33.9109, lng: 151.1585 },
  'Newtown': { lat: -33.8967, lng: 151.1800 },
  'Petersham': { lat: -33.8949, lng: 151.1544 },
  'Rozelle': { lat: -33.8615, lng: 151.1706 },
  'Summer Hill': { lat: -33.8922, lng: 151.1377 },

  // North Shore
  'Artarmon': { lat: -33.8089, lng: 151.1857 },
  'Chatswood': { lat: -33.7969, lng: 151.1833 },
  'Crows Nest': { lat: -33.8261, lng: 151.1999 },
  'Lane Cove': { lat: -33.8149, lng: 151.1667 },
  'Mosman': { lat: -33.8292, lng: 151.2441 },
  'Neutral Bay': { lat: -33.8302, lng: 151.2189 },
  'North Sydney': { lat: -33.8396, lng: 151.2073 },
  'Willoughby': { lat: -33.8003, lng: 151.1958 },
  'Wollstonecraft': { lat: -33.8331, lng: 151.1949 },

  // Northern Beaches
  'Brookvale': { lat: -33.7631, lng: 151.2719 },
  'Collaroy': { lat: -33.7376, lng: 151.3010 },
  'Dee Why': { lat: -33.7534, lng: 151.2848 },
  'Manly': { lat: -33.7969, lng: 151.2851 },
  'Narrabeen': { lat: -33.7109, lng: 151.2995 },
  'Palm Beach': { lat: -33.5973, lng: 151.3250 },

  // Western Sydney
  'Auburn': { lat: -33.8492, lng: 151.0328 },
  'Bankstown': { lat: -33.9173, lng: 151.0343 },
  'Blacktown': { lat: -33.7692, lng: 150.9051 },
  'Granville': { lat: -33.8327, lng: 151.0122 },
  'Homebush': { lat: -33.8667, lng: 151.0833 },
  'Lidcombe': { lat: -33.8639, lng: 151.0442 },
  'Mount Druitt': { lat: -33.7674, lng: 150.8203 },
  'Parramatta': { lat: -33.8136, lng: 151.0037 },
  'Penrith': { lat: -33.7507, lng: 150.6877 },
  'Rooty Hill': { lat: -33.7711, lng: 150.8450 },
  'Strathfield': { lat: -33.8730, lng: 151.0937 },
  'Westmead': { lat: -33.8076, lng: 150.9876 },

  // South West Sydney
  'Campbelltown': { lat: -34.0647, lng: 150.8144 },
  'Casula': { lat: -33.9520, lng: 150.9106 },
  'Fairfield': { lat: -33.8731, lng: 150.9561 },
  'Hoxton Park': { lat: -33.9337, lng: 150.8526 },
  'Ingleburn': { lat: -34.0107, lng: 150.8692 },
  'Liverpool': { lat: -33.9200, lng: 150.9229 },
  'Punchbowl': { lat: -33.9282, lng: 151.0523 },
  'Revesby': { lat: -33.9528, lng: 151.0141 },
  'Wetherill Park': { lat: -33.8490, lng: 150.9119 },

  // Southern Sydney & St George
  'Brighton-Le-Sands': { lat: -33.9594, lng: 151.1553 },
  'Canterbury': { lat: -33.9126, lng: 151.1184 },
  'Hurstville': { lat: -33.9676, lng: 151.1027 },
  'Kogarah': { lat: -33.9635, lng: 151.1327 },
  'Rockdale': { lat: -33.9521, lng: 151.1372 },
  'Sans Souci': { lat: -33.9947, lng: 151.1345 },

  // Sutherland Shire
  'Cronulla': { lat: -34.0571, lng: 151.1522 },
  'Engadine': { lat: -34.0656, lng: 151.0127 },
  'Gymea': { lat: -34.0334, lng: 151.0853 },
  'Menai': { lat: -34.0137, lng: 151.0144 },
  'Miranda': { lat: -34.0350, lng: 151.1003 },
  'Sutherland': { lat: -34.0313, lng: 151.0574 },

  // Greater Ryde & Macquarie
  'Macquarie Park': { lat: -33.7789, lng: 151.1240 },
  'Meadowbank': { lat: -33.8163, lng: 151.0900 },
  'Ryde': { lat: -33.8153, lng: 151.1042 },

  // Emerging/Edge Suburbs
  'Concord': { lat: -33.8604, lng: 151.1060 },
  'Drummoyne': { lat: -33.8522, lng: 151.1543 },
  'Five Dock': { lat: -33.8667, lng: 151.1294 },
  'Rhodes': { lat: -33.8313, lng: 151.0880 },
  'Wentworth Point': { lat: -33.8272, lng: 151.0785 },

  // Hills District
  'Castle Hill': { lat: -33.7318, lng: 151.0017 },
  'Hornsby': { lat: -33.7050, lng: 151.0982 },
  'Burwood': { lat: -33.8774, lng: 151.1048 },

  // Default fallback
  'Default': { lat: -33.8688, lng: 151.2093 }, // Sydney CBD
}

export function getCoordinatesForSuburb(suburb: string): { lat: number; lng: number } {
  return SUBURB_COORDINATES[suburb] || SUBURB_COORDINATES['Sydney CBD'] || SUBURB_COORDINATES['Default']
}