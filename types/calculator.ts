export type Provider = 'sanmar' | 'other';

export interface ScreenPrintInputs {
  quantity: number;
  blankCost: number;
  provider: Provider;
  colorsFront: number;
  colorsBack: number;
  darkGarment: boolean;
  isHoodie: boolean;
  outboundShipping: number;
}

export interface ScreenPrintResult {
  tier: string;
  setupFee: number;
  printCostPerPiece: number;
  totalPrintCost: number;
  blankCostFinal: number;
  totalBlankCost: number;
  inboundShipping: number;
  subtotal: number;
  total: number;
  perPiece: number;
  totalScreens: number;
  upsellData: UpsellData | null;
}

export interface EmbroideryInputs {
  quantity: number;
  capCost: number;
  stitches: number;
  newLogo: boolean;
  outboundShipping: number;
}

export interface EmbroideryResult {
  tier: string;
  sellPrice: number;
  totalRevenue: number;
  digitizingFee: number;
  stitchFee: number;
  subtotal: number;
  total: number;
  perPiece: number;
  upsellData: UpsellData | null;
}

export interface UpsellData {
  nextQuantity: number;
  savings: number;
  additionalPieces: number;
}

export interface ScreenPrintOrderItem {
  id: string;
  code: string;
  color: string;
  size: string;
  quantity: number;
  blankCost: number;
  provider: Provider;
  colorsFront: number;
  colorsBack: number;
  darkGarment: boolean;
  isHoodie: boolean;
  // calculation is computed dynamically, not stored
}

export interface ScreenPrintOrderItemWithCalculation extends ScreenPrintOrderItem {
  calculation: ScreenPrintResult;
}

export interface OrderTotals {
  totalPieces: number;
  totalSetupFees: number;
  totalBlankCost: number;
  totalPrintCost: number;
  totalInboundShipping: number;
  outboundShipping: number;
  baseCost: number; // Costo base antes de markup
  markupAmount: number; // Monto del markup
  subtotalWithMarkup: number; // Subtotal después de markup
  cloverFee: number;
  total: number;
  // Legacy field for backward compatibility (deprecated, use subtotalWithMarkup)
  subtotal?: number;
}

export interface User {
  username: string;
  password: string;
  name: string;
}

export interface SavedQuotation {
  id: string;
  date: string;
  clientName: string;
  businessName: string;
  items: ScreenPrintOrderItem[];
  totals: OrderTotals;
  createdBy: string;
  globalTier: string;
}
