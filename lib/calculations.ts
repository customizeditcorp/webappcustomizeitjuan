import { CONFIG, SCREEN_PRINT_MATRIX, EMBROIDERY_SELL_TIERS } from './constants';
import type { ScreenPrintInputs, ScreenPrintResult, EmbroideryInputs, EmbroideryResult, UpsellData, ScreenPrintOrderItem } from '@/types/calculator';

export const findClosestTier = (quantity: number, tiers: string[]): string => {
  const sortedTiers = tiers.map(Number).sort((a, b) => a - b);
  for (const tier of sortedTiers) {
    if (quantity <= tier) return tier.toString();
  }
  return sortedTiers[sortedTiers.length - 1].toString();
};

// Calculate print cost per piece using a global tier (for multi-item orders)
export const calculatePrintCostPerPiece = (
  globalTier: string,
  colorsFront: number,
  colorsBack: number,
  darkGarment: boolean,
  isHoodie: boolean
): number => {
  let totalColorsFront = colorsFront + (darkGarment ? 1 : 0);
  let totalColorsBack = colorsBack + (darkGarment ? 1 : 0);
  
  let printCostPerPiece = 0;
  
  if (colorsFront > 0) {
    const frontColorKey = Math.min(totalColorsFront, 6).toString();
    const tierData = SCREEN_PRINT_MATRIX[globalTier as keyof typeof SCREEN_PRINT_MATRIX];
    printCostPerPiece += tierData?.[frontColorKey as keyof typeof tierData] || 0;
  }
  
  if (colorsBack > 0) {
    const backColorKey = Math.min(totalColorsBack, 6).toString();
    const tierData = SCREEN_PRINT_MATRIX[globalTier as keyof typeof SCREEN_PRINT_MATRIX];
    printCostPerPiece += tierData?.[backColorKey as keyof typeof tierData] || 0;
  }

  if (isHoodie) {
    printCostPerPiece += CONFIG.BULK_ITEM_FEE;
  }

  return printCostPerPiece;
};

// Calculate a complete item result using a global tier (for multi-item orders)
export const calculateItemWithGlobalTier = (
  item: ScreenPrintOrderItem,
  globalTier: string
): ScreenPrintResult => {
  let totalColorsFront = item.colorsFront;
  let totalColorsBack = item.colorsBack;
  let totalScreens = 0;

  if (item.colorsFront > 0) {
    totalScreens += item.colorsFront;
    if (item.darkGarment) {
      totalScreens += 1;
      totalColorsFront += 1;
    }
  }

  if (item.colorsBack > 0) {
    totalScreens += item.colorsBack;
    if (item.darkGarment) {
      totalScreens += 1;
      totalColorsBack += 1;
    }
  }

  const setupFee = CONFIG.SCREEN_SETUP_FEE * totalScreens;
  const printCostPerPiece = calculatePrintCostPerPiece(
    globalTier,
    item.colorsFront,
    item.colorsBack,
    item.darkGarment,
    item.isHoodie
  );
  const totalPrintCost = printCostPerPiece * item.quantity;

  let blankCostFinal = item.blankCost;
  if (item.provider === 'sanmar') {
    blankCostFinal = item.blankCost * (1 + CONFIG.SANMAR_MARKUP);
  }
  const totalBlankCost = blankCostFinal * item.quantity;

  // Inbound shipping is calculated at order level, not item level
  const inboundShipping = 0;

  // Subtotal without shipping (shipping calculated at order level)
  const subtotal = setupFee + totalPrintCost + totalBlankCost;
  const total = subtotal;
  const perPiece = total / item.quantity;

  return {
    tier: globalTier,
    setupFee,
    printCostPerPiece,
    totalPrintCost,
    blankCostFinal,
    totalBlankCost,
    inboundShipping,
    subtotal,
    total,
    perPiece,
    totalScreens,
    upsellData: null // Upsell calculated at order level
  };
};

const calculateScreenPrintUpsell = (
  inputs: ScreenPrintInputs,
  currentTier: string,
  blankCostFinal: number,
  setupFee: number,
  inboundShipping: number,
  currentPerPiece: number
): UpsellData | null => {
  const tiers = Object.keys(SCREEN_PRINT_MATRIX).map(Number).sort((a, b) => a - b);
  const currentTierIndex = tiers.findIndex(t => t.toString() === currentTier);
  
  if (currentTierIndex >= tiers.length - 1) return null;

  const nextTier = tiers[currentTierIndex + 1];
  const nextTierKey = nextTier.toString();
  
  let totalColorsFront = inputs.colorsFront + (inputs.darkGarment ? 1 : 0);
  let totalColorsBack = inputs.colorsBack + (inputs.darkGarment ? 1 : 0);
  
  let nextPrintCostPerPiece = 0;
  if (inputs.colorsFront > 0) {
    const frontColorKey = Math.min(totalColorsFront, 6).toString();
    const tierData = SCREEN_PRINT_MATRIX[nextTierKey as keyof typeof SCREEN_PRINT_MATRIX];
    nextPrintCostPerPiece += tierData?.[frontColorKey as keyof typeof tierData] || 0;
  }
  if (inputs.colorsBack > 0) {
    const backColorKey = Math.min(totalColorsBack, 6).toString();
    const tierData = SCREEN_PRINT_MATRIX[nextTierKey as keyof typeof SCREEN_PRINT_MATRIX];
    nextPrintCostPerPiece += tierData?.[backColorKey as keyof typeof tierData] || 0;
  }
  if (inputs.isHoodie) {
    nextPrintCostPerPiece += CONFIG.BULK_ITEM_FEE;
  }

  const nextTotalPrintCost = nextPrintCostPerPiece * nextTier;
  const nextTotalBlankCost = blankCostFinal * nextTier;
  const nextInboundShipping = inputs.provider === 'sanmar' && nextTotalBlankCost < CONFIG.INBOUND_SHIP_THRESHOLD 
    ? CONFIG.INBOUND_SHIP_COST 
    : 0;
  const nextSubtotal = setupFee + nextTotalPrintCost + nextTotalBlankCost + nextInboundShipping + inputs.outboundShipping;
  const nextTotal = nextSubtotal * CONFIG.CLOVER_FEE;
  const nextPerPiece = nextTotal / nextTier;

  const savings = currentPerPiece - nextPerPiece;
  
  if (savings > 1.00) {
    return {
      nextQuantity: nextTier,
      savings,
      additionalPieces: nextTier - inputs.quantity
    };
  }

  return null;
};

export const calculateScreenPrint = (inputs: ScreenPrintInputs): ScreenPrintResult => {
  const tier = findClosestTier(inputs.quantity, Object.keys(SCREEN_PRINT_MATRIX));
  
  let totalColorsFront = inputs.colorsFront;
  let totalColorsBack = inputs.colorsBack;
  let totalScreens = 0;

  if (inputs.colorsFront > 0) {
    totalScreens += inputs.colorsFront;
    if (inputs.darkGarment) {
      totalScreens += 1;
      totalColorsFront += 1;
    }
  }

  if (inputs.colorsBack > 0) {
    totalScreens += inputs.colorsBack;
    if (inputs.darkGarment) {
      totalScreens += 1;
      totalColorsBack += 1;
    }
  }

  const setupFee = CONFIG.SCREEN_SETUP_FEE * totalScreens;

  let printCostPerPiece = 0;
  
  if (inputs.colorsFront > 0) {
    const frontColorKey = Math.min(totalColorsFront, 6).toString();
    const tierData = SCREEN_PRINT_MATRIX[tier as keyof typeof SCREEN_PRINT_MATRIX];
    printCostPerPiece += tierData?.[frontColorKey as keyof typeof tierData] || 0;
  }
  
  if (inputs.colorsBack > 0) {
    const backColorKey = Math.min(totalColorsBack, 6).toString();
    const tierData = SCREEN_PRINT_MATRIX[tier as keyof typeof SCREEN_PRINT_MATRIX];
    printCostPerPiece += tierData?.[backColorKey as keyof typeof tierData] || 0;
  }

  if (inputs.isHoodie) {
    printCostPerPiece += CONFIG.BULK_ITEM_FEE;
  }

  const totalPrintCost = printCostPerPiece * inputs.quantity;

  let blankCostFinal = inputs.blankCost;
  if (inputs.provider === 'sanmar') {
    blankCostFinal = inputs.blankCost * (1 + CONFIG.SANMAR_MARKUP);
  }
  const totalBlankCost = blankCostFinal * inputs.quantity;

  let inboundShipping = 0;
  if (inputs.provider === 'sanmar' && totalBlankCost < CONFIG.INBOUND_SHIP_THRESHOLD) {
    inboundShipping = CONFIG.INBOUND_SHIP_COST;
  }

  const subtotal = setupFee + totalPrintCost + totalBlankCost + inboundShipping + inputs.outboundShipping;
  const total = subtotal * CONFIG.CLOVER_FEE;
  const perPiece = total / inputs.quantity;

  const upsellData = calculateScreenPrintUpsell(
    inputs,
    tier,
    blankCostFinal,
    setupFee,
    inboundShipping,
    perPiece
  );

  return {
    tier,
    setupFee,
    printCostPerPiece,
    totalPrintCost,
    blankCostFinal,
    totalBlankCost,
    inboundShipping,
    subtotal,
    total,
    perPiece,
    totalScreens,
    upsellData
  };
};

const calculateEmbroideryUpsell = (
  inputs: EmbroideryInputs,
  currentTier: string,
  stitchFee: number,
  digitizingFee: number,
  currentPerPiece: number
): UpsellData | null => {
  const tiers = Object.keys(EMBROIDERY_SELL_TIERS).map(Number).sort((a, b) => a - b);
  const currentTierIndex = tiers.findIndex(t => t.toString() === currentTier);
  
  if (currentTierIndex >= tiers.length - 1) return null;

  const nextTier = tiers[currentTierIndex + 1];
  const nextTierKey = nextTier.toString();
  let nextSellPrice = EMBROIDERY_SELL_TIERS[nextTierKey as keyof typeof EMBROIDERY_SELL_TIERS];
  
  if (inputs.capCost > CONFIG.EMB_BASE_CAP) {
    nextSellPrice += inputs.capCost - CONFIG.EMB_BASE_CAP;
  }
  if (inputs.stitches > CONFIG.EMB_STITCH_LIMIT) {
    nextSellPrice += stitchFee;
  }

  const nextTotalRevenue = nextSellPrice * nextTier;
  const nextSubtotal = nextTotalRevenue + digitizingFee + inputs.outboundShipping;
  const nextTotal = nextSubtotal * CONFIG.CLOVER_FEE;
  const nextPerPiece = nextTotal / nextTier;

  const savings = currentPerPiece - nextPerPiece;
  
  if (savings > 1.00) {
    return {
      nextQuantity: nextTier,
      savings,
      additionalPieces: nextTier - inputs.quantity
    };
  }

  return null;
};

export const calculateEmbroidery = (inputs: EmbroideryInputs): EmbroideryResult => {
  const tier = findClosestTier(inputs.quantity, Object.keys(EMBROIDERY_SELL_TIERS));
  let sellPrice = EMBROIDERY_SELL_TIERS[tier as keyof typeof EMBROIDERY_SELL_TIERS];

  if (inputs.capCost > CONFIG.EMB_BASE_CAP) {
    sellPrice += inputs.capCost - CONFIG.EMB_BASE_CAP;
  }

  let stitchFee = 0;
  if (inputs.stitches > CONFIG.EMB_STITCH_LIMIT) {
    const extraStitches = inputs.stitches - CONFIG.EMB_STITCH_LIMIT;
    const extraThousands = Math.ceil(extraStitches / 1000);
    stitchFee = extraThousands * CONFIG.EMB_EXTRA_1K;
    sellPrice += stitchFee;
  }

  const totalRevenue = sellPrice * inputs.quantity;

  let digitizingFee = 0;
  if (inputs.newLogo && inputs.quantity < CONFIG.DIGITIZING_FREE_QTY) {
    digitizingFee = CONFIG.DIGITIZING_FEE;
  }

  const subtotal = totalRevenue + digitizingFee + inputs.outboundShipping;
  const total = subtotal * CONFIG.CLOVER_FEE;
  const perPiece = total / inputs.quantity;

  const upsellData = calculateEmbroideryUpsell(inputs, tier, stitchFee, digitizingFee, perPiece);

  return {
    tier,
    sellPrice,
    totalRevenue,
    digitizingFee,
    stitchFee,
    subtotal,
    total,
    perPiece,
    upsellData
  };
};
