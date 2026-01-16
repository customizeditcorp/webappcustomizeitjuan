export const SCREEN_PRINT_MATRIX = {
  "36": { "1": 3.81, "2": 5.49, "3": 7.16, "4": 8.83, "5": 10.52, "6": 12.19 },
  "48": { "1": 2.42, "2": 3.21, "3": 4.00, "4": 4.81, "5": 5.61, "6": 6.41 },
  "72": { "1": 1.58, "2": 2.24, "3": 2.88, "4": 3.54, "5": 4.17, "6": 4.83 },
  "144": { "1": 1.42, "2": 1.86, "3": 2.27, "4": 2.66, "5": 2.99, "6": 3.42 },
  "250": { "1": 1.36, "2": 1.55, "3": 1.85, "4": 2.22, "5": 2.59, "6": 2.99 },
  "500": { "1": 1.26, "2": 1.45, "3": 1.64, "4": 2.01, "5": 2.36, "6": 2.72 }
} as const;

export const EMBROIDERY_SELL_TIERS = {
  "12": 24.00,
  "24": 19.50,
  "48": 16.50,
  "72": 14.99,
  "144": 13.99
} as const;

export const CONFIG = {
  SANMAR_MARKUP: 0.03,
  CLOVER_FEE: 1.04,
  INBOUND_SHIP_THRESHOLD: 200,
  INBOUND_SHIP_COST: 25.00,
  OUTBOUND_SHIP_DEFAULT: 35.00,
  BULK_ITEM_FEE: 0.50,
  SCREEN_SETUP_FEE: 20.00,
  EMB_BASE_CAP: 5.50,
  EMB_STITCH_LIMIT: 6000,
  EMB_EXTRA_1K: 0.50,
  DIGITIZING_FEE: 35.00,
  DIGITIZING_FREE_QTY: 72
} as const;
