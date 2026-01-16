import type { SavedQuotation, ScreenPrintOrderItem } from '@/types/calculator';

const STORAGE_KEY = 'textile_calculator_quotations';

export const saveQuotation = (quotation: Omit<SavedQuotation, 'id' | 'date'>): SavedQuotation => {
  const newQuotation: SavedQuotation = {
    ...quotation,
    id: `${Date.now()}-${Math.random()}`,
    date: new Date().toISOString(),
  };

  const quotations = getQuotations();
  quotations.unshift(newQuotation); // Add to beginning
  localStorage.setItem(STORAGE_KEY, JSON.stringify(quotations));
  return newQuotation;
};

export const getQuotations = (): SavedQuotation[] => {
  if (typeof window === 'undefined') return [];
  const data = localStorage.getItem(STORAGE_KEY);
  return data ? JSON.parse(data) : [];
};

export const deleteQuotation = (id: string): void => {
  const quotations = getQuotations();
  const filtered = quotations.filter(q => q.id !== id);
  localStorage.setItem(STORAGE_KEY, JSON.stringify(filtered));
};

export const getQuotation = (id: string): SavedQuotation | null => {
  const quotations = getQuotations();
  return quotations.find(q => q.id === id) || null;
};
