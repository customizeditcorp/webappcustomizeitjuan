'use client';

import React, { useState, useMemo, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Switch } from '@/components/ui/switch';
import { Label } from '@/components/ui/label';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';
import { Separator } from '@/components/ui/separator';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Toaster } from '@/components/ui/sonner';
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from '@/components/ui/tooltip';
import { toast } from 'sonner';
import { Copy, TrendingUp, Shirt, Scissors, X, Plus, Lock, FileText, LogIn, LogOut, Save, Trash2, Calendar, Eye, MessageSquare, AlertCircle } from 'lucide-react';
import { CONFIG, EMBROIDERY_SELL_TIERS, SCREEN_PRINT_MATRIX } from '@/lib/constants';
import { formatCurrency } from '@/lib/formatters';
import { calculateEmbroidery, findClosestTier, calculateItemWithGlobalTier } from '@/lib/calculations';
import { getCurrentUser, setCurrentUser as setCurrentUserStorage, logout as logoutUser, login as loginUser, register as registerUser, needsRegistration as needsUserRegistration, changePassword as changeUserPassword, type User } from '@/lib/auth';
import { saveQuotation, getQuotations, deleteQuotation } from '@/lib/storage';
import type { Provider, ScreenPrintOrderItem, OrderTotals, SavedQuotation, ScreenPrintResult } from '@/types/calculator';

export default function TextilePriceCalculator() {
// ============================================
  // 🔐 AUTH STATE
// ============================================
  const [currentUser, setCurrentUserState] = useState<User | null>(null);
  const [loginEmail, setLoginEmail] = useState<string>('');
  const [loginPassword, setLoginPassword] = useState<string>('');
  const [loginName, setLoginName] = useState<string>('');
  const [isRegistering, setIsRegistering] = useState<boolean>(false);
  const [isChangingPassword, setIsChangingPassword] = useState<boolean>(false);
  const [newPassword, setNewPassword] = useState<string>('');
  const [confirmPassword, setConfirmPassword] = useState<string>('');
  const [loginError, setLoginError] = useState<string>('');

// ============================================
  // 📋 CLIENT/BUSINESS INFO
// ============================================
  const [clientName, setClientName] = useState<string>('');
  const [businessName, setBusinessName] = useState<string>('');

// ============================================
  // 🖨️ SCREEN PRINT FORM STATE
// ============================================
  const [spCode, setSpCode] = useState<string>('');
  const [spColor, setSpColor] = useState<string>('');
  const [spSize, setSpSize] = useState<string>('');
  const [spQuantity, setSpQuantity] = useState<number>(48);
  const [spBlankCost, setSpBlankCost] = useState<number>(5.50);
  const [spProvider, setSpProvider] = useState<Provider>('sanmar');
  const [spColorsFront, setSpColorsFront] = useState<number>(1);
  const [spColorsBack, setSpColorsBack] = useState<number>(0);
  const [spDarkGarment, setSpDarkGarment] = useState<boolean>(false);
  const [spIsHoodie, setSpIsHoodie] = useState<boolean>(false);

  // ============================================
  // 🛒 SCREEN PRINT ORDER ITEMS
  // ============================================
  const [orderItems, setOrderItems] = useState<ScreenPrintOrderItem[]>([]);
  const [formError, setFormError] = useState<string>('');

  // ============================================
  // 🧵 EMBROIDERY STATE
  // ============================================
  const [embQuantity, setEmbQuantity] = useState<number>(24);
  const [embCapCost, setEmbCapCost] = useState<number>(4.50);
  const [embStitches, setEmbStitches] = useState<number>(5000);
  const [embNewLogo, setEmbNewLogo] = useState<boolean>(false);

  // ============================================
  // 📦 SHIPPING STATE
  // ============================================
  const [outboundShipping, setOutboundShipping] = useState<number>(CONFIG.OUTBOUND_SHIP_DEFAULT);

  // ============================================
  // 💰 MARKUP STATE (Screen Print)
  // ============================================
  const [markupPercent, setMarkupPercent] = useState<number>(45); // Default 45%
  const [markupType, setMarkupType] = useState<'preset' | 'custom'>('preset');
  const [customMarkup, setCustomMarkup] = useState<number>(45);
  const [showCustomMarkupInput, setShowCustomMarkupInput] = useState<boolean>(false);

  // ============================================
  // 💰 MARKUP STATE (Embroidery)
  // ============================================
  const [embMarkupPercent, setEmbMarkupPercent] = useState<number>(45); // Default 45%
  const [embMarkupType, setEmbMarkupType] = useState<'preset' | 'custom'>('preset');
  const [embCustomMarkup, setEmbCustomMarkup] = useState<number>(45);
  const [showEmbCustomMarkupInput, setShowEmbCustomMarkupInput] = useState<boolean>(false);

  const markupPresets = [
    { value: 40, label: '40% - Competitivo' },
    { value: 45, label: '45% - Estándar' },
    { value: 50, label: '50% - Premium' },
    { value: 55, label: '55% - Alto Valor' },
  ];

  // ============================================
  // 💾 SAVED QUOTATIONS
  // ============================================
  const [savedQuotations, setSavedQuotations] = useState<SavedQuotation[]>([]);
  const [selectedTab, setSelectedTab] = useState<string>('screen');

  // ============================================
  // 👁️ EXPORT PREVIEWS (Screen Print)
  // ============================================
  const [showInternalPreview, setShowInternalPreview] = useState<boolean>(false);
  const [showClientPreview, setShowClientPreview] = useState<boolean>(false);
  const [showSMSPreview, setShowSMSPreview] = useState<boolean>(false);

  // ============================================
  // 👁️ EXPORT PREVIEWS (Embroidery)
  // ============================================
  const [showInternalPreviewEmb, setShowInternalPreviewEmb] = useState<boolean>(false);
  const [showClientPreviewEmb, setShowClientPreviewEmb] = useState<boolean>(false);
  const [showSMSPreviewEmb, setShowSMSPreviewEmb] = useState<boolean>(false);

  // ============================================
  // 📋 CLIPBOARD FUNCTION WITH TOAST
  // ============================================
  const copyToClipboard = async (text: string, type: string) => {
    try {
      await navigator.clipboard.writeText(text);
      toast.success(`${type} copiado al portapapeles`, {
        description: 'Listo para pegar',
        duration: 2000,
      });
    } catch (err) {
      toast.error('Error al copiar', {
        description: 'No se pudo copiar al portapapeles',
        duration: 3000,
      });
    }
  };

  // ============================================
  // 🔐 AUTH EFFECTS
  // ============================================
  useEffect(() => {
    const user = getCurrentUser();
    setCurrentUserState(user);
  }, []);

  // ============================================
  // 💾 LOAD SAVED QUOTATIONS
  // ============================================
  useEffect(() => {
    if (currentUser) {
      const quotations = getQuotations();
      setSavedQuotations(quotations);
    }
  }, [currentUser]);

  // ============================================
  // 🧮 SCREEN PRINT CALCULATIONS (CORRECTED - GLOBAL TIER + SETUP FEE POR DISEÑO)
  // ============================================
  
  // Helper function to create a design key for grouping items
  const getDesignKey = (item: ScreenPrintOrderItem): string => {
    return `${item.colorsFront}-${item.colorsBack}-${item.darkGarment}-${item.isHoodie}`;
  };

  // Calculate global tier based on total quantity
  const globalTier = useMemo(() => {
    if (orderItems.length === 0) return '48';
    const totalQuantity = orderItems.reduce((sum, item) => sum + item.quantity, 0);
    return findClosestTier(totalQuantity, Object.keys(SCREEN_PRINT_MATRIX));
  }, [orderItems]);

  // Group items by design (same colors, dark garment, hoodie status)
  const designGroups = useMemo(() => {
    const groups = new Map<string, ScreenPrintOrderItem[]>();
    orderItems.forEach(item => {
      const key = getDesignKey(item);
      if (!groups.has(key)) {
        groups.set(key, []);
      }
      groups.get(key)!.push(item);
    });
    return groups;
  }, [orderItems]);

  // Calculate setup fee per design group (once per unique design)
  const setupFeeByDesign = useMemo(() => {
    const fees = new Map<string, number>();
    designGroups.forEach((items, designKey) => {
      if (items.length > 0) {
        const firstItem = items[0];
    let totalScreens = 0;
        
        if (firstItem.colorsFront > 0) {
          totalScreens += firstItem.colorsFront;
          if (firstItem.darkGarment) {
            totalScreens += 1;
          }
        }
        
        if (firstItem.colorsBack > 0) {
          totalScreens += firstItem.colorsBack;
          if (firstItem.darkGarment) {
            totalScreens += 1;
          }
        }
        
        fees.set(designKey, CONFIG.SCREEN_SETUP_FEE * totalScreens);
      }
    });
    return fees;
  }, [designGroups]);

  // Calculate each item with global tier (without setup fee in item calculation)
  const itemCalculations = useMemo(() => {
    return orderItems.map(item => calculateItemWithGlobalTier(item, globalTier));
  }, [orderItems, globalTier]);

  // Calculate order totals with correct setup fee logic and markup
  const orderTotals = useMemo((): OrderTotals => {
    if (orderItems.length === 0) {
      return {
        totalPieces: 0,
        totalSetupFees: 0,
        totalBlankCost: 0,
        totalPrintCost: 0,
        totalInboundShipping: 0,
        outboundShipping,
        baseCost: 0,
        markupAmount: 0,
        subtotalWithMarkup: 0,
        cloverFee: 0,
        total: 0
      };
    }

    const totalPieces = orderItems.reduce((sum, item) => sum + item.quantity, 0);
    
    // Calculate total setup fees: one fee per unique design
    const totalSetupFees = Array.from(setupFeeByDesign.values()).reduce((sum, fee) => sum + fee, 0);
    
    const totalBlankCost = itemCalculations.reduce((sum, calc) => sum + calc.totalBlankCost, 0);
    const totalPrintCost = itemCalculations.reduce((sum, calc) => sum + calc.totalPrintCost, 0);

    // Calculate inbound shipping based on total blanks
    const hasSanMar = orderItems.some(item => item.provider === 'sanmar');
    const totalInboundShipping = hasSanMar && totalBlankCost < CONFIG.INBOUND_SHIP_THRESHOLD 
      ? CONFIG.INBOUND_SHIP_COST 
      : 0;

    // Base cost (before markup): Setup + Blanks + Print + Shipping
    const baseCost = totalSetupFees + totalPrintCost + totalBlankCost + totalInboundShipping + outboundShipping;
    
    // Apply markup
    const currentMarkup = markupType === 'custom' ? customMarkup : markupPercent;
    const markupAmount = baseCost * (currentMarkup / 100);
    const subtotalWithMarkup = baseCost + markupAmount;
    
    // Apply Clover Fee (4%) to subtotal with markup
    const cloverFee = subtotalWithMarkup * (CONFIG.CLOVER_FEE - 1);
    const total = subtotalWithMarkup * CONFIG.CLOVER_FEE;

    return {
      totalPieces,
      totalSetupFees,
      totalBlankCost,
      totalPrintCost,
      totalInboundShipping,
      outboundShipping,
      baseCost,
      markupAmount,
      subtotalWithMarkup,
      cloverFee,
      total
    };
  }, [orderItems, itemCalculations, setupFeeByDesign, outboundShipping, markupPercent, markupType, customMarkup]);

  // Get setup fee for a specific item (based on its design group)
  const getItemSetupFee = (item: ScreenPrintOrderItem): number => {
    const designKey = getDesignKey(item);
    return setupFeeByDesign.get(designKey) || 0;
  };

  // Get number of items sharing the same design
  const getItemsInDesignGroup = (item: ScreenPrintOrderItem): number => {
    const designKey = getDesignKey(item);
    return designGroups.get(designKey)?.length || 1;
  };

  // ============================================
  // 🧮 EMBROIDERY CALCULATIONS (with markup)
  // ============================================
  const embroideryCalcBase = useMemo(() => {
    return calculateEmbroidery({
      quantity: embQuantity,
      capCost: embCapCost,
      stitches: embStitches,
      newLogo: embNewLogo,
      outboundShipping
    });
  }, [embQuantity, embCapCost, embStitches, embNewLogo, outboundShipping]);

  // Apply markup to embroidery calculation
  const embroideryCalc = useMemo(() => {
    const base = embroideryCalcBase;
    
    // Base cost: Revenue + Digitizing + Outbound Shipping
    const baseCost = base.subtotal;
    
    // Apply markup
    const currentMarkup = embMarkupType === 'custom' ? embCustomMarkup : embMarkupPercent;
    const markupAmount = baseCost * (currentMarkup / 100);
    const subtotalWithMarkup = baseCost + markupAmount;
    
    // Apply Clover Fee (4%) to subtotal with markup
    const cloverFee = subtotalWithMarkup * (CONFIG.CLOVER_FEE - 1);
    const total = subtotalWithMarkup * CONFIG.CLOVER_FEE;
    const perPiece = total / embQuantity;

    return {
      ...base,
      baseCost,
      markupAmount,
      subtotalWithMarkup,
      cloverFee,
      total,
      perPiece
    };
  }, [embroideryCalcBase, embMarkupPercent, embMarkupType, embCustomMarkup, embQuantity]);

  // ============================================
  // 🔐 LOGIN FUNCTIONS
  // ============================================
  const handleLogin = () => {
    if (isRegistering) {
      // Modo registro - crear contraseña
      const result = registerUser(loginEmail, loginPassword, loginName);
      if (result.success && result.user) {
        setCurrentUserStorage(result.user);
        setCurrentUserState(result.user);
        setLoginError('');
        setLoginEmail('');
        setLoginPassword('');
        setLoginName('');
        setIsRegistering(false);
        toast.success('Contraseña creada', {
          description: 'Bienvenido! Tu cuenta ha sido configurada.',
          duration: 3000,
        });
      } else {
        setLoginError(result.message);
      }
    } else {
      // Modo login normal
      const user = loginUser(loginEmail, loginPassword);
      if (user) {
        // Verificar si tiene contraseña temporal
        if (user.isTemporaryPassword) {
          // Forzar cambio de contraseña
          setIsChangingPassword(true);
          setLoginError('');
          // Mantener el usuario en estado pero no hacer login completo hasta cambiar password
        } else {
          // Login normal
          setCurrentUserStorage(user);
          setCurrentUserState(user);
          setLoginError('');
          setLoginEmail('');
          setLoginPassword('');
          setIsRegistering(false);
        }
      } else {
        // Verificar si necesita registro
        if (loginEmail && needsUserRegistration(loginEmail)) {
          setIsRegistering(true);
          setLoginError('');
        } else {
          setLoginError('Email o contraseña incorrectos');
        }
      }
    }
  };

  const handleChangePassword = () => {
    if (!newPassword || !confirmPassword) {
      setLoginError('Por favor completa ambos campos de contraseña');
      return;
    }
    
    if (newPassword !== confirmPassword) {
      setLoginError('Las contraseñas no coinciden');
      return;
    }
    
    if (newPassword.length < 6) {
      setLoginError('La contraseña debe tener al menos 6 caracteres');
      return;
    }
    
    // Obtener usuario actual (el que acaba de hacer login con password temporal)
    const tempUser = loginUser(loginEmail, loginPassword);
    if (!tempUser) {
      setLoginError('Error: No se pudo verificar el usuario');
      return;
    }
    
    const result = changeUserPassword(loginEmail, loginPassword, newPassword);
    if (result.success && result.user) {
      // Login con la nueva contraseña
      setCurrentUserStorage(result.user);
      setCurrentUserState(result.user);
      setLoginError('');
      setLoginEmail('');
      setLoginPassword('');
      setNewPassword('');
      setConfirmPassword('');
      setIsChangingPassword(false);
      toast.success('Contraseña actualizada', {
        description: 'Tu contraseña ha sido cambiada exitosamente.',
        duration: 3000,
      });
    } else {
      setLoginError(result.message);
    }
  };

  const handleLogout = () => {
    logoutUser();
    setCurrentUserState(null);
    setOrderItems([]);
    setClientName('');
    setBusinessName('');
  };

  // ============================================
  // 🎯 ORDER MANAGEMENT FUNCTIONS
  // ============================================
  const handleAddItem = () => {
    if (!clientName.trim() || !businessName.trim()) {
      setFormError('Por favor completa el nombre del cliente y el nombre del negocio');
      toast.error('Error de validación', {
        description: 'Completa el nombre del cliente y el nombre del negocio',
        duration: 3000,
      });
      return;
    }
    
    if (!spCode.trim() || !spColor.trim() || !spSize.trim()) {
      setFormError('Por favor completa código, color y talla');
      toast.error('Error de validación', {
        description: 'Completa código, color y talla',
        duration: 3000,
      });
      return;
    }

    // Nueva validación: al menos 1 color
    if (spColorsFront === 0 && spColorsBack === 0) {
      setFormError('Debes seleccionar al menos 1 color en frente o espalda');
      toast.error('Error de validación', {
        description: 'Debes seleccionar al menos 1 color en frente o espalda',
        duration: 3000,
      });
      return;
    }

    const newItem: ScreenPrintOrderItem = {
      id: `${Date.now()}-${Math.random()}`,
      code: spCode.trim(),
      color: spColor.trim(),
      size: spSize.trim(),
      quantity: spQuantity,
      blankCost: spBlankCost,
      provider: spProvider,
      colorsFront: spColorsFront,
      colorsBack: spColorsBack,
      darkGarment: spDarkGarment,
      isHoodie: spIsHoodie
    };

    setOrderItems([...orderItems, newItem]);
    setFormError('');
    
    // Clear form
    setSpCode('');
    setSpColor('');
    setSpSize('');
    
    toast.success('Item agregado', {
      description: `${newItem.code} - ${newItem.color} - ${newItem.size} agregado a la orden`,
      duration: 2000,
    });
  };

  // Función helper para validar si se puede agregar item
  const canAddItem = (): boolean => {
    return clientName.trim() !== '' && 
           businessName.trim() !== '' && 
           spCode.trim() !== '' && 
           spColor.trim() !== '' && 
           spSize.trim() !== '' && 
           spQuantity > 0 &&
           (spColorsFront > 0 || spColorsBack > 0);
  };

  // ============================================
  // 💡 PREVIEW FUNCTIONS FOR SUGGESTIONS
  // ============================================

  // Calculate preview price for Screen Print color suggestions
  const calculateColorPreview = (totalColors: number): { perPiece: number; total: number } => {
    // Determinar tier basado en cantidad
    const tier = findClosestTier(spQuantity, Object.keys(SCREEN_PRINT_MATRIX));
    
    // Calcular colores con base oscura si aplica
    let effectiveColors = totalColors;
    if (spDarkGarment) {
      effectiveColors = totalColors + 1;
    }
    
    // Buscar precio en matriz (máx 6 colores)
    const colorKey = Math.min(effectiveColors, 6).toString();
    const tierData = SCREEN_PRINT_MATRIX[tier as keyof typeof SCREEN_PRINT_MATRIX];
    const printCost = tierData?.[colorKey as keyof typeof tierData] || 0;
    
    // Aplicar hoodie fee si aplica
    let costPerPiece = printCost;
      if (spIsHoodie) {
      costPerPiece += CONFIG.BULK_ITEM_FEE;
    }
    
    // Setup fee (por pantalla)
    let setupScreens = totalColors;
    if (spDarkGarment) {
      setupScreens += 1; // base blanca
    }
    const setupFee = setupScreens * CONFIG.SCREEN_SETUP_FEE;
    
    // Blank cost
    let blankCost = spBlankCost;
    if (spProvider === 'sanmar') {
      blankCost *= (1 + CONFIG.SANMAR_MARKUP);
    }
    
    // Totales
    const totalPrint = costPerPiece * spQuantity;
    const totalBlanks = blankCost * spQuantity;
    const inboundShipping = spProvider === 'sanmar' && totalBlanks < CONFIG.INBOUND_SHIP_THRESHOLD 
      ? CONFIG.INBOUND_SHIP_COST 
      : 0;
    const subtotal = setupFee + totalPrint + totalBlanks + inboundShipping + outboundShipping;
    
    // Aplicar markup
    const currentMarkup = markupType === 'custom' ? customMarkup : markupPercent;
    const withMarkup = subtotal * (1 + currentMarkup / 100);
    const finalTotal = withMarkup * CONFIG.CLOVER_FEE;
    const perPiece = finalTotal / spQuantity;
    
    return { perPiece, total: finalTotal };
  };

  // Calculate preview price for Screen Print tier upsell suggestions
  const calculateTierPreview = (nextTierQty: number): { perPiece: number; total: number; savings: number } => {
    const currentColors = spColorsFront + spColorsBack;
    
    // Calcular colores con base oscura si aplica
    let effectiveColors = currentColors;
    if (spDarkGarment) {
      effectiveColors = currentColors + 1;
    }
    
    // Buscar precio en matriz del siguiente tier
    const colorKey = Math.min(effectiveColors, 6).toString();
    const tierData = SCREEN_PRINT_MATRIX[nextTierQty.toString() as keyof typeof SCREEN_PRINT_MATRIX];
    const printCost = tierData?.[colorKey as keyof typeof tierData] || 0;
    
    // Aplicar hoodie fee si aplica
    let costPerPiece = printCost;
    if (spIsHoodie) {
      costPerPiece += CONFIG.BULK_ITEM_FEE;
    }
    
    // Setup fee (por pantalla) - mismo setup que la cantidad actual
    let setupScreens = currentColors;
    if (spDarkGarment) {
      setupScreens += 1;
    }
    const setupFee = setupScreens * CONFIG.SCREEN_SETUP_FEE;
    
    // Blank cost
    let blankCost = spBlankCost;
    if (spProvider === 'sanmar') {
      blankCost *= (1 + CONFIG.SANMAR_MARKUP);
    }
    
    // Totales con nueva cantidad
    const totalPrint = costPerPiece * nextTierQty;
    const totalBlanks = blankCost * nextTierQty;
    const inboundShipping = spProvider === 'sanmar' && totalBlanks < CONFIG.INBOUND_SHIP_THRESHOLD 
      ? CONFIG.INBOUND_SHIP_COST 
      : 0;
    const subtotal = setupFee + totalPrint + totalBlanks + inboundShipping + outboundShipping;
    
    // Aplicar markup
    const currentMarkup = markupType === 'custom' ? customMarkup : markupPercent;
    const withMarkup = subtotal * (1 + currentMarkup / 100);
    const finalTotal = withMarkup * CONFIG.CLOVER_FEE;
    const perPiece = finalTotal / nextTierQty;
    
    // Calcular ahorro comparado con cantidad actual
    const currentPreview = calculateColorPreview(currentColors);
    const savings = currentPreview.perPiece - perPiece;
    
    return { perPiece, total: finalTotal, savings };
  };

  // Calculate preview price for Embroidery stitch suggestions
  const calculateStitchPreview = (stitches: number): { perPiece: number; total: number } => {
    // Encontrar tier
    const tier = findClosestTier(embQuantity, Object.keys(EMBROIDERY_SELL_TIERS));
    let sellPrice = EMBROIDERY_SELL_TIERS[tier as keyof typeof EMBROIDERY_SELL_TIERS];

    // Ajuste de gorra
    if (embCapCost > CONFIG.EMB_BASE_CAP) {
      sellPrice += (embCapCost - CONFIG.EMB_BASE_CAP);
    }
    
    // Calcular fee por puntadas extra
    if (stitches > CONFIG.EMB_STITCH_LIMIT) {
      const extraStitches = stitches - CONFIG.EMB_STITCH_LIMIT;
      const extraThousands = Math.ceil(extraStitches / 1000);
      sellPrice += (extraThousands * CONFIG.EMB_EXTRA_1K);
    }

    // Revenue
    const revenue = sellPrice * embQuantity;

    // Digitizing
    let digitizing = 0;
    if (embNewLogo && embQuantity < CONFIG.DIGITIZING_FREE_QTY) {
      digitizing = CONFIG.DIGITIZING_FEE;
    }
    
    // Totales
    const subtotal = revenue + digitizing + outboundShipping;
    
    // Aplicar markup
    const currentMarkup = embMarkupType === 'custom' ? embCustomMarkup : embMarkupPercent;
    const withMarkup = subtotal * (1 + currentMarkup / 100);
    const finalTotal = withMarkup * CONFIG.CLOVER_FEE;
    const perPiece = finalTotal / embQuantity;
    
    return { perPiece, total: finalTotal };
  };

  const handleRemoveItem = (id: string) => {
    setOrderItems(orderItems.filter(item => item.id !== id));
  };

  // ============================================
  // 💾 SAVE QUOTATION
  // ============================================
  const handleSaveQuotation = () => {
    if (!currentUser || orderItems.length === 0) return;
    
    const quotation = saveQuotation({
      clientName,
      businessName,
      items: orderItems,
      totals: orderTotals,
      createdBy: currentUser.name,
      globalTier
    });
    
    setSavedQuotations([quotation, ...savedQuotations]);
  };

  // ============================================
  // 📥 LOAD QUOTATION
  // ============================================
  const handleLoadQuotation = (quotation: SavedQuotation) => {
    setClientName(quotation.clientName);
    setBusinessName(quotation.businessName);
    setOrderItems(quotation.items);
    setSavedQuotations(getQuotations());
    setSelectedTab('screen');
  };

  // ============================================
  // 🗑️ DELETE QUOTATION
  // ============================================
  const handleDeleteQuotation = (id: string) => {
    deleteQuotation(id);
    setSavedQuotations(getQuotations());
  };

  // ============================================
  // 📤 EXPORT FUNCTIONS
  // ============================================
  const generateInternalExport = (): string => {
    let text = `ANÁLISIS INTERNO - ORDEN SCREEN PRINT\n`;
    text += `=====================================\n\n`;
    text += `Cliente: ${clientName}\n`;
    text += `Negocio: ${businessName}\n`;
    text += `Creado por: ${currentUser?.name || 'N/A'}\n`;
    text += `Fecha: ${new Date().toLocaleDateString('es-ES')}\n\n`;
    text += `TOTAL DE PIEZAS: ${orderTotals.totalPieces}\n`;
    text += `NÚMERO DE ITEMS: ${orderItems.length}\n`;
    text += `TIER GLOBAL APLICADO: ${globalTier} unidades\n\n`;

    // Show setup fees by design group first
    text += `SETUP FEES (por diseño único):\n`;
    text += `${'='.repeat(50)}\n`;
    setupFeeByDesign.forEach((fee, designKey) => {
      const items = designGroups.get(designKey) || [];
      const itemsCount = items.length;
      const firstItem = items[0];
      const totalScreens = Math.ceil(fee / CONFIG.SCREEN_SETUP_FEE);
      text += `Diseño: ${firstItem.colorsFront} frente / ${firstItem.colorsBack} espalda, ${firstItem.darkGarment ? 'Oscura' : 'Clara'}, ${firstItem.isHoodie ? 'Hoodie' : 'Regular'}\n`;
      text += `  Compartido entre ${itemsCount} item${itemsCount > 1 ? 's' : ''}: ${formatCurrency(fee)}\n`;
    });
    text += `\n`;

    text += `DESGLOSE POR ITEM:\n`;
    text += `${'='.repeat(50)}\n\n`;

    orderItems.forEach((item, index) => {
      const calc = itemCalculations[index];
      const itemsInDesign = getItemsInDesignGroup(item);
      const setupFeePerDesign = getItemSetupFee(item);
      
      text += `ITEM ${index + 1}: ${item.code} - ${item.color} - ${item.size}\n`;
      text += `Cantidad: ${item.quantity} piezas\n`;
      text += `Proveedor: ${item.provider === 'sanmar' ? 'SanMar' : 'Otro'}\n`;
      text += `Tier: ${globalTier} unidades (global)\n`;
      text += `Colores: ${item.colorsFront} frente / ${item.colorsBack} espalda\n`;
      text += `Prenda oscura: ${item.darkGarment ? 'Sí' : 'No'}\n`;
      text += `Tipo: ${item.isHoodie ? 'Hoodie/Sudadera' : 'Regular'}\n\n`;

      text += `Costos del Item:\n`;
      if (itemsInDesign > 1) {
        text += `  Setup Fee (compartido entre ${itemsInDesign} items): ${formatCurrency(setupFeePerDesign)} (${formatCurrency(setupFeePerDesign / itemsInDesign)}/item aprox.)\n`;
    } else {
        text += `  Setup Fee: ${formatCurrency(setupFeePerDesign)}\n`;
      }
      text += `  Costo Blanks: ${formatCurrency(calc.totalBlankCost)} (${formatCurrency(calc.blankCostFinal)}/pc)\n`;
      text += `  Costo Impresión: ${formatCurrency(calc.totalPrintCost)} (${formatCurrency(calc.printCostPerPiece)}/pc)\n`;
      // Item subtotal without setup fee (setup is at design level)
      text += `  Subtotal Item (sin setup): ${formatCurrency(calc.totalPrintCost + calc.totalBlankCost)}\n\n`;
    });

    text += `RESUMEN TOTAL DE LA ORDEN:\n`;
    text += `${'='.repeat(50)}\n`;
    text += `Setup Fees Total (${setupFeeByDesign.size} diseño${setupFeeByDesign.size > 1 ? 's' : ''} único${setupFeeByDesign.size > 1 ? 's' : ''}): ${formatCurrency(orderTotals.totalSetupFees)}\n`;
    text += `Blanks Total: ${formatCurrency(orderTotals.totalBlankCost)}\n`;
    text += `Impresión Total: ${formatCurrency(orderTotals.totalPrintCost)}\n`;
    text += `Envío Inbound: ${formatCurrency(orderTotals.totalInboundShipping)}\n`;
    text += `Envío Outbound: ${formatCurrency(orderTotals.outboundShipping)}\n`;
    text += `Costo Base: ${formatCurrency(orderTotals.baseCost)}\n`;
    text += `Markup (${markupType === 'custom' ? customMarkup : markupPercent}%): +${formatCurrency(orderTotals.markupAmount)}\n`;
    text += `Subtotal (con markup): ${formatCurrency(orderTotals.subtotalWithMarkup)}\n`;
    text += `Clover Fee (4%): ${formatCurrency(orderTotals.cloverFee)}\n`;
    text += `TOTAL FINAL: ${formatCurrency(orderTotals.total)}\n`;
    text += `\n💰 GANANCIA: ${formatCurrency(orderTotals.markupAmount)}\n`;

    return text;
  };

  const generateClientExport = (): string => {
    let text = `COTIZACIÓN - SCREEN PRINT\n`;
    text += `========================\n\n`;
    text += `Cliente: ${clientName}\n`;
    text += `Negocio: ${businessName}\n\n`;

    orderItems.forEach((item, index) => {
      const calc = itemCalculations[index];
      const itemsInDesign = getItemsInDesignGroup(item);
      const setupFeePerDesign = getItemSetupFee(item);
      const setupFeePerItem = setupFeePerDesign / itemsInDesign;
      
      // Item base cost includes proportional setup fee, print, blanks, and shipping
      const itemBaseCost = setupFeePerItem + calc.totalPrintCost + calc.totalBlankCost + (orderTotals.totalInboundShipping / orderItems.length) + (orderTotals.outboundShipping / orderItems.length);
      
      // Apply markup proportionally
      const currentMarkup = markupType === 'custom' ? customMarkup : markupPercent;
      const itemMarkupAmount = itemBaseCost * (currentMarkup / 100);
      const itemSubtotalWithMarkup = itemBaseCost + itemMarkupAmount;
      
      // Apply Clover Fee
      const itemTotal = itemSubtotalWithMarkup * CONFIG.CLOVER_FEE;
      const itemPerPieceFinal = itemTotal / item.quantity;
      
      text += `Item ${index + 1}:\n`;
      text += `Producto: ${item.code} - ${item.color} - Talla ${item.size}\n`;
      text += `Cantidad: ${item.quantity} piezas\n`;
      text += `Impresión: ${item.colorsFront > 0 ? `${item.colorsFront} color${item.colorsFront > 1 ? 'es' : ''} frente` : ''}${item.colorsFront > 0 && item.colorsBack > 0 ? ' / ' : ''}${item.colorsBack > 0 ? `${item.colorsBack} color${item.colorsBack > 1 ? 'es' : ''} espalda` : ''}\n`;
      text += `Precio por pieza: ${formatCurrency(itemPerPieceFinal)}\n`;
      text += `Total: ${formatCurrency(itemTotal)}\n\n`;
    });

    text += `TOTAL GENERAL: ${formatCurrency(orderTotals.total)}\n\n`;
    text += `✓ Incluye impresión y envío`;

    return text;
  };

  const generateSMSExport = (): string => {
    const stylesText = orderItems.length === 1 ? '1 estilo' : `${orderItems.length} estilos`;
    return `Hola! Tu cotización por ${orderTotals.totalPieces} piezas (${stylesText}) es ${formatCurrency(orderTotals.total)}. Incluye todo. ¿Avanzamos?`;
  };

  // Embroidery exports
  const generateInternalExportEmbroidery = (): string => {
    const calc = embroideryCalc;
    let text = `ANÁLISIS INTERNO - BORDADO\n`;
    text += `=====================================\n\n`;
    text += `Cliente: ${clientName || 'N/A'}\n`;
    text += `Negocio: ${businessName || 'N/A'}\n`;
    text += `Creado por: ${currentUser?.name || 'N/A'}\n`;
    text += `Fecha: ${new Date().toLocaleDateString('es-ES')}\n\n`;
    text += `CANTIDAD: ${embQuantity} gorras\n`;
    text += `TIER DE PRECIO: ${calc.tier} unidades\n\n`;
    text += `ESPECIFICACIONES:\n`;
    text += `- Costo Gorra Base: ${formatCurrency(embCapCost)}\n`;
    text += `- Puntadas: ${embStitches.toLocaleString()}\n`;
    text += `- Logo Nuevo: ${embNewLogo ? 'Sí' : 'No'}\n\n`;
    text += `DESGLOSE DE COSTOS:\n`;
    text += `Precio Venta Base: ${formatCurrency(calc.sellPrice)}/pc\n`;
    text += `Revenue Total: ${formatCurrency(calc.totalRevenue)}\n`;
    if (calc.digitizingFee > 0) {
      text += `Digitizing Fee: ${formatCurrency(calc.digitizingFee)}\n`;
    }
    text += `Envío Outbound: ${formatCurrency(outboundShipping)}\n`;
    text += `Costo Base: ${formatCurrency(calc.baseCost)}\n`;
    text += `Markup (${embMarkupType === 'custom' ? embCustomMarkup : embMarkupPercent}%): +${formatCurrency(calc.markupAmount)}\n`;
    text += `Subtotal (con markup): ${formatCurrency(calc.subtotalWithMarkup)}\n`;
    text += `Clover Fee (4%): ${formatCurrency(calc.cloverFee)}\n`;
    text += `TOTAL FINAL: ${formatCurrency(calc.total)}\n`;
    text += `Precio por Pieza: ${formatCurrency(calc.perPiece)}\n`;
    text += `\n💰 GANANCIA: ${formatCurrency(calc.markupAmount)}\n`;
    return text;
  };

  const generateClientExportEmbroidery = (): string => {
    const calc = embroideryCalc;
    let text = `COTIZACIÓN - BORDADO\n`;
    text += `========================\n\n`;
    text += `Cliente: ${clientName || 'N/A'}\n`;
    text += `Negocio: ${businessName || 'N/A'}\n\n`;
    text += `Cantidad: ${embQuantity} gorras bordadas\n`;
    text += `Puntadas: ${embStitches.toLocaleString()}\n`;
    text += `Logo Nuevo: ${embNewLogo ? 'Sí' : 'No'}\n\n`;
    text += `Precio por pieza: ${formatCurrency(calc.perPiece)}\n`;
    text += `TOTAL GENERAL: ${formatCurrency(calc.total)}\n\n`;
    text += `✓ Incluye bordado y envío`;
    return text;
  };

  const generateSMSExportEmbroidery = (): string => {
      return `Hola! Tu cotización por ${embQuantity} gorras bordadas es ${formatCurrency(embroideryCalc.total)}. Incluye todo. ¿Avanzamos?`;
  };

  // ============================================
  // 🔐 LOGIN SCREEN
  // ============================================
  if (!currentUser || isChangingPassword) {
  return (
      <div className="min-h-screen bg-gradient-to-br from-slate-50 to-slate-100 flex items-center justify-center p-4">
        <Card className="w-full max-w-md">
          <CardHeader>
            <CardTitle className="text-2xl text-center">Calculadora Customize It!</CardTitle>
            <CardDescription className="text-center">
              {isChangingPassword 
                ? 'Debes cambiar tu contraseña temporal' 
                : isRegistering 
                  ? 'Crea tu contraseña para continuar' 
                  : 'Inicia sesión para continuar'}
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            {loginError && (
              <Alert variant="destructive">
                <AlertCircle className="h-4 w-4" />
                <AlertDescription>{loginError}</AlertDescription>
              </Alert>
            )}
            
            {isChangingPassword && (
              <Alert className="bg-orange-50 border-orange-200">
                <AlertCircle className="h-4 w-4 text-orange-600" />
                <AlertDescription className="text-orange-800">
                  <strong>Contraseña temporal detectada.</strong> Por seguridad, debes crear una nueva contraseña para continuar.
                </AlertDescription>
              </Alert>
            )}
            
            {isRegistering && !isChangingPassword && (
              <Alert className="bg-blue-50 border-blue-200">
                <AlertCircle className="h-4 w-4 text-blue-600" />
                <AlertDescription className="text-blue-800">
                  Este email necesita crear una contraseña. Completa el formulario para continuar.
                </AlertDescription>
              </Alert>
            )}
            
            {!isChangingPassword && (
              <div className="space-y-2">
                <Label htmlFor="email">Email</Label>
                <Input
                  id="email"
                  type="email"
                  value={loginEmail}
                  onChange={(e) => {
                    setLoginEmail(e.target.value);
                    setLoginError('');
                    // Verificar si necesita registro cuando cambia el email
                    if (e.target.value && needsUserRegistration(e.target.value)) {
                      setIsRegistering(true);
                    } else if (!e.target.value) {
                      setIsRegistering(false);
                    }
                  }}
                  placeholder="customizeditcorp@gmail.com o info@customizeitca.com"
                  onKeyDown={(e) => e.key === 'Enter' && !isChangingPassword && handleLogin()}
                  disabled={isRegistering || isChangingPassword}
                />
              </div>
            )}
            
            {isChangingPassword && (
              <>
                <div className="space-y-2">
                  <Label htmlFor="email-display">Email</Label>
                  <Input
                    id="email-display"
                    type="email"
                    value={loginEmail}
                    disabled
                    className="bg-gray-100"
                  />
                </div>
                
                <div className="space-y-2">
                  <Label htmlFor="new-password">Nueva Contraseña</Label>
                  <Input
                    id="new-password"
                    type="password"
                    value={newPassword}
                    onChange={(e) => setNewPassword(e.target.value)}
                    placeholder="Ingresa tu nueva contraseña"
                    onKeyDown={(e) => e.key === 'Enter' && handleChangePassword()}
                  />
                  <p className="text-xs text-[#6B7280]">
                    Mínimo 6 caracteres. Debe ser diferente a la contraseña temporal.
                  </p>
                </div>
                
                <div className="space-y-2">
                  <Label htmlFor="confirm-password">Confirmar Nueva Contraseña</Label>
                  <Input
                    id="confirm-password"
                    type="password"
                    value={confirmPassword}
                    onChange={(e) => setConfirmPassword(e.target.value)}
                    placeholder="Confirma tu nueva contraseña"
                    onKeyDown={(e) => e.key === 'Enter' && handleChangePassword()}
                  />
                </div>
              </>
            )}
            
            {!isChangingPassword && isRegistering && (
              <div className="space-y-2">
                <Label htmlFor="name">Nombre</Label>
                <Input
                  id="name"
                  type="text"
                  value={loginName}
                  onChange={(e) => setLoginName(e.target.value)}
                  placeholder="Tu nombre completo"
                  onKeyDown={(e) => e.key === 'Enter' && handleLogin()}
                />
              </div>
            )}
            
            {!isChangingPassword && (
              <div className="space-y-2">
                <Label htmlFor="password">
                  {isRegistering ? 'Nueva Contraseña' : 'Contraseña'}
                </Label>
                <Input
                  id="password"
                  type="password"
                  value={loginPassword}
                  onChange={(e) => setLoginPassword(e.target.value)}
                  placeholder="••••••••"
                  onKeyDown={(e) => e.key === 'Enter' && handleLogin()}
                />
                {isRegistering && (
                  <p className="text-xs text-[#6B7280]">
                    Crea una contraseña segura para tu cuenta
                  </p>
                )}
              </div>
            )}
            
            <Button 
              onClick={isChangingPassword ? handleChangePassword : handleLogin} 
              className="w-full bg-[#FF6B35] hover:bg-[#FF8C61] text-white" 
              size="lg"
            >
              {isChangingPassword ? (
                <>
                  <Lock className="w-4 h-4 mr-2" />
                  Cambiar Contraseña
                </>
              ) : isRegistering ? (
                <>
                  <Lock className="w-4 h-4 mr-2" />
                  Crear Contraseña
                </>
              ) : (
                <>
                  <LogIn className="w-4 h-4 mr-2" />
                  Iniciar Sesión
                </>
              )}
            </Button>
            
            {isRegistering && !isChangingPassword && (
              <Button
                variant="ghost"
                onClick={() => {
                  setIsRegistering(false);
                  setLoginError('');
                  setLoginPassword('');
                  setLoginName('');
                }}
                className="w-full"
              >
                Volver a Iniciar Sesión
              </Button>
            )}
          </CardContent>
        </Card>
      </div>
    );
  }

  // ============================================
  // 📱 MAIN CALCULATOR UI
  // ============================================
  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 to-orange-50">
      <div className="max-w-7xl mx-auto p-4">
        {/* Header */}
        <div className="mb-8 bg-white shadow-md rounded-lg p-4 md:p-6">
          <div className="flex items-center justify-between flex-wrap gap-4">
            <div className="flex items-center gap-4">
              <img 
                src="/customize_it_logo_web-07.png" 
                alt="Customize It!" 
                className="h-12 w-auto"
                onError={(e) => {
                  // Fallback si no existe el logo
                  e.currentTarget.style.display = 'none';
                }}
              />
              <div>
                <h1 className="text-2xl font-bold text-gray-900">Calculadora de Precios</h1>
                <p className="text-[#6B7280] text-sm">Screen Printing & Bordado</p>
              </div>
            </div>
            <div className="flex items-center gap-4">
              <span className="text-sm text-[#6B7280]">Hola, {currentUser.name}</span>
              <Button 
                variant="outline" 
                onClick={handleLogout}
                className="border-[#6B7280] text-[#6B7280] hover:bg-gray-50"
              >
                <LogOut className="w-4 h-4 mr-2" />
                Cerrar Sesión
              </Button>
            </div>
          </div>
        </div>

        <Tabs value={selectedTab} onValueChange={setSelectedTab} className="w-full">
          <TabsList className="grid w-full max-w-2xl grid-cols-3 mb-8 bg-white p-1 rounded-lg border border-gray-200">
            <TabsTrigger 
              value="screen" 
              className="flex items-center gap-2 data-[state=active]:bg-[#FF6B35] data-[state=active]:text-white data-[state=inactive]:text-[#6B7280] data-[state=inactive]:border-[#6B7280] hover:border-[#FF6B35] transition-colors"
            >
              <Shirt className="w-4 h-4" />
              Screen Print
            </TabsTrigger>
            <TabsTrigger 
              value="embroidery" 
              className="flex items-center gap-2 data-[state=active]:bg-[#FF6B35] data-[state=active]:text-white data-[state=inactive]:text-[#6B7280] data-[state=inactive]:border-[#6B7280] hover:border-[#FF6B35] transition-colors"
            >
              <Scissors className="w-4 h-4" />
              Bordado
            </TabsTrigger>
            <TabsTrigger 
              value="saved" 
              className="flex items-center gap-2 data-[state=active]:bg-[#FF6B35] data-[state=active]:text-white data-[state=inactive]:text-[#6B7280] data-[state=inactive]:border-[#6B7280] hover:border-[#FF6B35] transition-colors"
            >
              <Calendar className="w-4 h-4" />
              Cotizaciones Guardadas
            </TabsTrigger>
          </TabsList>

          {/* ============================================ */}
          {/* SCREEN PRINTING TAB */}
          {/* ============================================ */}
          <TabsContent value="screen">
            <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
              {/* Left Column - Form + Items List */}
              <div className="lg:col-span-8 space-y-6">
                {/* Client/Business Info */}
                <Card className="bg-white rounded-xl border border-slate-200 shadow-sm">
                  <CardHeader>
                    <CardTitle>Información del Cliente</CardTitle>
                    <CardDescription>Datos obligatorios antes de agregar items</CardDescription>
                  </CardHeader>
                  <CardContent className="space-y-4">
                    <div className="space-y-2">
                      <Label htmlFor="client-name" className="text-sm font-medium text-slate-700">Nombre del Cliente *</Label>
                      <Input
                        id="client-name"
                        type="text"
                        value={clientName}
                        onChange={(e) => setClientName(e.target.value)}
                        placeholder="Juan Pérez"
                        className="focus:ring-2 focus:ring-primary"
                      />
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="business-name" className="text-sm font-medium text-slate-700">Nombre del Negocio *</Label>
                      <Input
                        id="business-name"
                        type="text"
                        value={businessName}
                        onChange={(e) => setBusinessName(e.target.value)}
                        placeholder="Mi Empresa S.A."
                        className="focus:ring-2 focus:ring-primary"
                      />
                    </div>
                  </CardContent>
                </Card>

                {/* Item Configuration Form */}
                <Card className="bg-white rounded-xl border border-slate-200 shadow-sm">
                  <CardHeader>
                    <CardTitle>Configuración del Item</CardTitle>
                    <CardDescription>Ingresa los detalles del producto</CardDescription>
                  </CardHeader>
                  <CardContent className="space-y-4">
                    {/* Código, Color, Talla */}
                    <div className="grid grid-cols-3 gap-4">
                      <div className="space-y-2">
                        <Label htmlFor="sp-code" className="text-sm font-medium text-slate-700">Código *</Label>
                        <Input
                          id="sp-code"
                          type="text"
                          value={spCode}
                          onChange={(e) => setSpCode(e.target.value)}
                          placeholder="G5000"
                          className="focus:ring-2 focus:ring-primary"
                        />
                      </div>
                      <div className="space-y-2">
                        <Label htmlFor="sp-color" className="text-sm font-medium text-slate-700">Color *</Label>
                        <Input
                          id="sp-color"
                          type="text"
                          value={spColor}
                          onChange={(e) => setSpColor(e.target.value)}
                          placeholder="Negro"
                          className="focus:ring-2 focus:ring-primary"
                        />
                      </div>
                      <div className="space-y-2">
                        <Label htmlFor="sp-size" className="text-sm font-medium text-slate-700">Talla *</Label>
                        <Select value={spSize} onValueChange={setSpSize}>
                          <SelectTrigger id="sp-size">
                            <SelectValue placeholder="Selecciona talla" />
                          </SelectTrigger>
                          <SelectContent>
                            <SelectItem value="YXS">Youth XS</SelectItem>
                            <SelectItem value="YS">Youth S</SelectItem>
                            <SelectItem value="YM">Youth M</SelectItem>
                            <SelectItem value="YL">Youth L</SelectItem>
                            <SelectItem value="YXL">Youth XL</SelectItem>
                            <SelectItem value="XS">XS</SelectItem>
                            <SelectItem value="S">S</SelectItem>
                            <SelectItem value="M">M</SelectItem>
                            <SelectItem value="L">L</SelectItem>
                            <SelectItem value="XL">XL</SelectItem>
                            <SelectItem value="2XL">2XL</SelectItem>
                            <SelectItem value="3XL">3XL</SelectItem>
                            <SelectItem value="4XL">4XL</SelectItem>
                            <SelectItem value="5XL">5XL</SelectItem>
                          </SelectContent>
                        </Select>
                      </div>
                    </div>

                    {formError && (
                      <Alert className="bg-red-50 border-red-200">
                        <AlertDescription className="text-red-800">{formError}</AlertDescription>
                      </Alert>
                    )}

                    <div className="grid grid-cols-2 gap-4">
                      <div className="space-y-2">
                        <Label htmlFor="sp-quantity" className="text-sm font-medium text-slate-700">Cantidad</Label>
                        <Input
                          id="sp-quantity"
                          type="number"
                          value={spQuantity}
                          onChange={(e) => setSpQuantity(Number(e.target.value))}
                          min={1}
                          className="focus:ring-2 focus:ring-primary"
                        />
                      </div>
                      <div className="space-y-2">
                        <Label htmlFor="sp-blank-cost" className="text-sm font-medium text-slate-700">Costo Blank ($)</Label>
                        <Input
                          id="sp-blank-cost"
                          type="number"
                          step="0.01"
                          value={spBlankCost}
                          onChange={(e) => setSpBlankCost(Number(e.target.value))}
                          min={0}
                          className="focus:ring-2 focus:ring-primary"
                        />
                      </div>
                    </div>

                    <div className="space-y-2">
                      <Label>Proveedor</Label>
                      <div className="flex gap-4">
                        <Button
                          variant={spProvider === 'sanmar' ? 'default' : 'outline'}
                          onClick={() => setSpProvider('sanmar')}
                          className="flex-1"
                        >
                          SanMar (+3%)
                        </Button>
                        <Button
                          variant={spProvider === 'other' ? 'default' : 'outline'}
                          onClick={() => setSpProvider('other')}
                          className="flex-1"
                        >
                          Otro
                        </Button>
                      </div>
                    </div>

                    <Separator />

                    <div className="grid grid-cols-2 gap-4">
                      <div className="space-y-2">
                        <Label htmlFor="sp-colors-front" className="text-sm font-medium text-slate-700">Colores Frente</Label>
                        <Input
                          id="sp-colors-front"
                          type="number"
                          value={spColorsFront}
                          onChange={(e) => setSpColorsFront(Number(e.target.value))}
                          min={0}
                          max={6}
                          className="focus:ring-2 focus:ring-primary"
                        />
                      </div>
                      <div className="space-y-2">
                        <Label htmlFor="sp-colors-back" className="text-sm font-medium text-slate-700">Colores Espalda</Label>
                        <Input
                          id="sp-colors-back"
                          type="number"
                          value={spColorsBack}
                          onChange={(e) => setSpColorsBack(Number(e.target.value))}
                          min={0}
                          max={6}
                          className="focus:ring-2 focus:ring-primary"
                        />
                      </div>
                    </div>

                    {spColorsFront === 0 && spColorsBack === 0 && (
                      <Alert variant="destructive" className="mt-2">
                        <AlertCircle className="h-4 w-4" />
                        <AlertTitle>⚠️ Advertencia</AlertTitle>
                        <AlertDescription>
                          Debes seleccionar al menos 1 color en frente o espalda
                        </AlertDescription>
                      </Alert>
                    )}

                    <div className="space-y-2">
                      <div>
                        <Label className="text-sm font-medium text-slate-700">¿Prenda Oscura?</Label>
                        <p className="text-sm text-muted-foreground">+1 color y +1 pantalla si es oscura</p>
                      </div>
                      <div className="flex gap-4">
                        <Button
                          type="button"
                          variant={spDarkGarment ? "default" : "outline"}
                          onClick={() => setSpDarkGarment(true)}
                          className="flex-1"
                        >
                          Sí (Base Blanca)
                        </Button>
                        <Button
                          type="button"
                          variant={!spDarkGarment ? "default" : "outline"}
                          onClick={() => setSpDarkGarment(false)}
                          className="flex-1"
                        >
                          No (Clara)
                        </Button>
                      </div>
                    </div>

                    <div className="flex items-center justify-between">
                      <div className="space-y-0.5">
                        <Label htmlFor="sp-hoodie" className="text-sm font-medium text-slate-700">Es Hoodie/Sudadera?</Label>
                        <p className="text-sm text-muted-foreground">+${CONFIG.BULK_ITEM_FEE.toFixed(2)}/pieza</p>
                      </div>
                      <Switch
                        id="sp-hoodie"
                        checked={spIsHoodie}
                        onCheckedChange={setSpIsHoodie}
                      />
                    </div>

                    <Separator />

                    {/* Markup Dropdown */}
                    <div className="space-y-2">
                      <Label htmlFor="markup-select" className="text-sm font-medium text-slate-700">Markup de Ganancia</Label>
                      <select
                        id="markup-select"
                        value={markupType === 'preset' ? markupPercent.toString() : 'custom'}
                        onChange={(e) => {
                          if (e.target.value === 'custom') {
                            setMarkupType('custom');
                            setShowCustomMarkupInput(true);
                          } else {
                            setMarkupType('preset');
                            setMarkupPercent(Number(e.target.value));
                            setShowCustomMarkupInput(false);
                          }
                        }}
                        className="flex h-9 w-full rounded-md border border-input bg-transparent px-3 py-1 text-sm shadow-xs transition-colors file:border-0 file:bg-transparent file:text-sm file:font-medium placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring disabled:cursor-not-allowed disabled:opacity-50"
                      >
                        {markupPresets.map(preset => (
                          <option key={preset.value} value={preset.value}>
                            {preset.label}
                          </option>
                        ))}
                        <option value="custom">Personalizado...</option>
                      </select>

                      {showCustomMarkupInput && (
                        <div className="flex gap-2">
                      <Input
                        type="number"
                            step="0.1"
                        min={0}
                            max={100}
                            value={customMarkup}
                            onChange={(e) => setCustomMarkup(Number(e.target.value))}
                            placeholder="0-100%"
                            className="flex-1 focus:ring-2 focus:ring-primary"
                          />
                          <Button
                            type="button"
                            onClick={() => {
                              setMarkupPercent(customMarkup);
                              setMarkupType('preset');
                              setShowCustomMarkupInput(false);
                              toast.success('Markup aplicado', {
                                description: `${customMarkup}% de markup aplicado`,
                                duration: 2000,
                              });
                            }}
                            size="sm"
                          >
                            Aplicar
                          </Button>
                    </div>
                      )}

                      {/* Preview de ganancia en tiempo real */}
                      {orderItems.length > 0 && (
                        <div className="p-2 bg-green-50 border border-green-200 rounded-md">
                          <p className="text-sm text-green-800">
                            💰 Tu ganancia: <span className="font-semibold">+{formatCurrency(orderTotals.markupAmount)}</span>
                          </p>
                        </div>
                      )}
                    </div>

                    <Separator />

                    <TooltipProvider>
                      <Tooltip>
                        <TooltipTrigger asChild>
                          <span className="w-full inline-block">
                            <Button
                              onClick={handleAddItem}
                              disabled={!canAddItem()}
                              className="w-full bg-[#FF6B35] hover:bg-[#FF8C61] text-white shadow-md shadow-orange-200 hover:shadow-lg hover:shadow-orange-300 disabled:opacity-50 disabled:cursor-not-allowed"
                              size="lg"
                            >
                              <Plus className="w-4 h-4 mr-2" />
                              Agregar Item a Orden
                            </Button>
                          </span>
                        </TooltipTrigger>
                        {!canAddItem() && (
                          <TooltipContent>
                            <p>Completa todos los campos y selecciona al menos 1 color</p>
                          </TooltipContent>
                        )}
                      </Tooltip>
                    </TooltipProvider>

                    {/* Color and Tier Suggestions Preview */}
                    {(() => {
                      const currentColors = spColorsFront + spColorsBack;
                      
                      // No mostrar si no hay datos mínimos
                      if (!spQuantity || !spCode.trim() || !spColor.trim() || !spSize) {
                        return null;
                      }
                      
                      // Calcular sugerencias de colores
                      const colorOptions = [];
                      if (currentColors < 4) {
                        for (let colors = currentColors + 1; colors <= 4; colors++) {
                          const preview = calculateColorPreview(colors);
                          colorOptions.push({
                            colors,
                            perPiece: preview.perPiece,
                            total: preview.total
                          });
                        }
                      }
                      
                      // Calcular sugerencias de tiers (upsell)
                      const tierOptions = [];
                      const currentTier = findClosestTier(spQuantity, Object.keys(SCREEN_PRINT_MATRIX));
                      const allTiers = Object.keys(SCREEN_PRINT_MATRIX).map(Number).sort((a, b) => a - b);
                      const currentTierIndex = allTiers.findIndex(t => t.toString() === currentTier);
                      
                      // Si no es el último tier, sugerir el siguiente
                      if (currentTierIndex < allTiers.length - 1 && spQuantity < allTiers[currentTierIndex]) {
                        const nextTier = allTiers[currentTierIndex];
                        const preview = calculateTierPreview(nextTier);
                        if (preview.savings > 0.50) { // Solo mostrar si hay ahorro significativo
                          tierOptions.push({
                            quantity: nextTier,
                            perPiece: preview.perPiece,
                            total: preview.total,
                            savings: preview.savings,
                            additional: nextTier - spQuantity
                          });
                        }
                      }
                      
                      // Si ya está en el tier exacto, mostrar el siguiente tier
                      if (spQuantity === parseInt(currentTier) && currentTierIndex < allTiers.length - 1) {
                        const nextTier = allTiers[currentTierIndex + 1];
                        const preview = calculateTierPreview(nextTier);
                        if (preview.savings > 0.50) {
                          tierOptions.push({
                            quantity: nextTier,
                            perPiece: preview.perPiece,
                            total: preview.total,
                            savings: preview.savings,
                            additional: nextTier - spQuantity
                          });
                        }
                      }
                      
                      if (colorOptions.length === 0 && tierOptions.length === 0) return null;
                      
                      return (
                        <>
                          {/* Sugerencias de Colores */}
                          {colorOptions.length > 0 && (
                            <Card className="mt-4 border-[#FF6B35] bg-orange-50">
                              <CardHeader>
                                <CardTitle className="text-sm text-gray-900">
                                  💡 ¿Quieres más colores?
                                </CardTitle>
                              </CardHeader>
                              <CardContent className="space-y-2">
                                {colorOptions.map(opt => (
                                  <div 
                                    key={opt.colors}
                                    className="flex justify-between items-center p-2 bg-white border border-gray-200 rounded hover:bg-orange-100 cursor-pointer transition-colors"
                                    onClick={() => {
                                      // Distribuir colores: si tiene frente, agregar ahí, sino en espalda
                                      if (spColorsFront > 0) {
                                        setSpColorsFront(opt.colors);
                                        setSpColorsBack(0);
                                      } else {
                                        setSpColorsFront(0);
                                        setSpColorsBack(opt.colors);
                                      }
                                      toast.success('Colores actualizados', {
                                        description: `Ahora tienes ${opt.colors} colores`,
                                        duration: 2000,
                                      });
                                    }}
                                  >
                                    <span className="text-sm">{opt.colors} colores</span>
                                    <span className="font-semibold text-sm">
                                      {formatCurrency(opt.perPiece)}/pc
                                    </span>
                                  </div>
                                ))}
                  </CardContent>
                </Card>
                          )}
                          
                          {/* Sugerencias de Tiers (Mejor Precio) */}
                          {tierOptions.length > 0 && (
                            <Card className="mt-4 border-[#3b1553] bg-purple-50">
                              <CardHeader>
                                <CardTitle className="text-sm text-gray-900 flex items-center gap-2">
                                  <TrendingUp className="w-4 h-4 text-[#3b1553]" />
                                  💰 Mejor Precio con Más Cantidad
                                </CardTitle>
                              </CardHeader>
                              <CardContent className="space-y-2">
                                {tierOptions.map(opt => (
                                  <div 
                                    key={opt.quantity}
                                    className="flex justify-between items-center p-2 bg-white border border-gray-200 rounded hover:bg-purple-100 cursor-pointer transition-colors"
                                    onClick={() => {
                                      setSpQuantity(opt.quantity);
                                      toast.success('Cantidad actualizada', {
                                        description: `Ahorras ${formatCurrency(opt.savings)}/pc con ${opt.quantity} piezas`,
                                        duration: 2000,
                                      });
                                    }}
                                  >
                                    <div className="flex flex-col">
                                      <span className="text-sm font-medium">{opt.quantity} piezas</span>
                                      <span className="text-xs text-[#6B7280]">
                                        {opt.additional} pieza{opt.additional > 1 ? 's' : ''} más
                                      </span>
              </div>
                                    <div className="flex flex-col items-end">
                                      <span className="font-semibold text-sm text-[#3b1553]">
                                        {formatCurrency(opt.perPiece)}/pc
                                      </span>
                                      <span className="text-xs text-green-600 font-medium">
                                        Ahorras {formatCurrency(opt.savings)}/pc
                                      </span>
                                    </div>
                                  </div>
                                ))}
                              </CardContent>
                            </Card>
                          )}
                        </>
                      );
                    })()}
                  </CardContent>
                </Card>

                {/* Items List */}
                {orderItems.length > 0 && (
                  <Card className="bg-white rounded-xl border border-slate-200 shadow-sm">
                    <CardHeader>
                      <CardTitle>Items en la Orden ({orderItems.length})</CardTitle>
                    </CardHeader>
                    <CardContent>
                      <div className="space-y-3">
                        {orderItems.map((item, index) => {
                          const calc = itemCalculations[index];
                          const itemsInDesign = getItemsInDesignGroup(item);
                          const setupFeePerDesign = getItemSetupFee(item);
                          const setupFeePerItem = setupFeePerDesign / itemsInDesign;
                          
                          // Item base cost includes proportional setup fee, print, blanks, and shipping
                          const itemBaseCost = setupFeePerItem + calc.totalPrintCost + calc.totalBlankCost + (orderTotals.totalInboundShipping / orderItems.length) + (orderTotals.outboundShipping / orderItems.length);
                          
                          // Apply markup proportionally
                          const currentMarkup = markupType === 'custom' ? customMarkup : markupPercent;
                          const itemMarkupAmount = itemBaseCost * (currentMarkup / 100);
                          const itemSubtotalWithMarkup = itemBaseCost + itemMarkupAmount;
                          
                          // Apply Clover Fee
                          const itemTotal = itemSubtotalWithMarkup * CONFIG.CLOVER_FEE;
                          
                          return (
                            <div
                              key={item.id}
                              className="flex items-center justify-between p-3 bg-white rounded-lg border border-gray-200 hover:border-[#FF6B35] transition-colors"
                            >
                              <div className="flex-1">
                                <div className="font-medium text-gray-900">
                                  {item.code} - {item.color} - {item.size} x {item.quantity} pcs
                                </div>
                                <div className="text-sm text-[#FF6B35] font-semibold">
                                  {formatCurrency(itemTotal)}
                                  {itemsInDesign > 1 && (
                                    <span className="ml-2 text-xs text-[#6B7280] font-normal">(setup compartido con {itemsInDesign - 1} otro{itemsInDesign > 2 ? 's' : ''})</span>
                                  )}
                                </div>
                              </div>
                              <Button
                                variant="ghost"
                                size="sm"
                                onClick={() => handleRemoveItem(item.id)}
                                className="text-[#6B7280] hover:text-red-500"
                              >
                                <X className="w-4 h-4" />
                              </Button>
                            </div>
                          );
                        })}
                      </div>
                    </CardContent>
                  </Card>
                )}
              </div>

              {/* Right Column - Summary + Export */}
              <div className="lg:col-span-4 space-y-6 sticky top-4">
                {orderItems.length === 0 ? (
                <Card className="bg-white rounded-xl border border-slate-200 shadow-sm">
                  <CardHeader>
                      <CardTitle>Resumen</CardTitle>
                      <CardDescription>Agrega items a la orden para ver el resumen</CardDescription>
                    </CardHeader>
                  </Card>
                ) : (
                  <>
                    <Card className="bg-white rounded-xl border border-slate-200 shadow-sm">
                      <CardHeader>
                        <CardTitle>Resumen de la Orden</CardTitle>
                        <CardDescription>
                          {orderTotals.totalPieces} piezas en {orderItems.length} items | Tier: {globalTier}
                        </CardDescription>
                  </CardHeader>
                  <CardContent className="space-y-4">
                    <div className="space-y-2 text-sm">
                      <div className="flex justify-between">
                            <span className="text-muted-foreground">Setup Fees Total</span>
                            <span className="font-medium">{formatCurrency(orderTotals.totalSetupFees)}</span>
                      </div>
                      <div className="flex justify-between">
                            <span className="text-muted-foreground">Blanks Total</span>
                            <span className="font-medium">{formatCurrency(orderTotals.totalBlankCost)}</span>
                      </div>
                      <div className="flex justify-between">
                            <span className="text-muted-foreground">Impresión Total</span>
                            <span className="font-medium">{formatCurrency(orderTotals.totalPrintCost)}</span>
                      </div>
                          {orderTotals.totalInboundShipping > 0 && (
                        <div className="flex justify-between">
                          <span className="text-muted-foreground">Envío Inbound</span>
                              <span className="font-medium">{formatCurrency(orderTotals.totalInboundShipping)}</span>
                        </div>
                      )}
                          <div className="space-y-2">
                            <Label htmlFor="order-outbound" className="text-sm font-medium text-slate-700">Envío Outbound ($)</Label>
                            <Input
                              id="order-outbound"
                              type="number"
                              step="0.01"
                              value={outboundShipping}
                              onChange={(e) => setOutboundShipping(Number(e.target.value))}
                              min={0}
                              className="focus:ring-2 focus:ring-primary"
                            />
                          </div>
                        </div>

                        <Separator />

                        {/* Análisis de Ganancia */}
                        <div className="bg-slate-900 text-white rounded-xl p-6 shadow-lg">
                          <div className="flex items-center gap-2 mb-4">
                            <span className="text-lg">💰</span>
                            <h3 className="font-semibold text-white">ANÁLISIS DE GANANCIA</h3>
                          </div>
                          
                          <div className="space-y-2 text-sm">
                      <div className="flex justify-between">
                              <span className="text-white/90">Costo Base:</span>
                              <span className="font-medium text-white">{formatCurrency(orderTotals.baseCost)}</span>
                            </div>
                            <div className="flex justify-between">
                              <span className="text-white/90">
                                Markup ({markupType === 'custom' ? customMarkup : markupPercent}%):
                              </span>
                              <span className="font-medium text-white">+{formatCurrency(orderTotals.markupAmount)}</span>
                            </div>
                            <div className="flex justify-between border-t border-white/20 pt-2">
                              <span className="text-white/90 font-medium">Subtotal:</span>
                              <span className="font-semibold text-white">{formatCurrency(orderTotals.subtotalWithMarkup)}</span>
                            </div>
                            <div className="flex justify-between">
                              <span className="text-white/90">Clover (4%):</span>
                              <span className="font-medium text-white">+{formatCurrency(orderTotals.cloverFee)}</span>
                            </div>
                            <Separator className="bg-white/20" />
                            <div className="flex justify-between items-center pt-1">
                              <span className="text-white font-semibold">TOTAL:</span>
                              <span className="text-4xl font-bold tracking-tight text-white">{formatCurrency(orderTotals.total)}</span>
                            </div>
                            <Separator className="bg-white/20" />
                            <div className="bg-white/10 rounded-md p-3 border border-white/20">
                              <div className="flex items-center justify-between">
                                <span className="text-white/90 font-semibold">Tu Ganancia:</span>
                                <span className="text-[#9de3c1] text-2xl font-bold">{formatCurrency(orderTotals.markupAmount)}</span>
                              </div>
                            </div>
                      </div>
                    </div>

                    <Separator />

                    <div className="space-y-2">
                      <div className="flex justify-between text-sm">
                            <span className="text-muted-foreground">Subtotal (con markup)</span>
                            <span className="font-medium">{formatCurrency(orderTotals.subtotalWithMarkup)}</span>
                      </div>
                      <div className="flex justify-between text-sm">
                        <span className="text-muted-foreground">Clover Fee (4%)</span>
                            <span className="font-medium">{formatCurrency(orderTotals.cloverFee)}</span>
                      </div>
                    </div>

                    <Separator />

                    <div className="space-y-2 bg-slate-50 p-4 rounded-lg">
                      <div className="flex justify-between items-center">
                        <span className="text-lg font-semibold">TOTAL FINAL</span>
                        <span className="text-2xl font-bold text-blue-600">
                              {formatCurrency(orderTotals.total)}
                        </span>
                      </div>
                    </div>

                        <Button
                          onClick={handleSaveQuotation}
                          className="w-full"
                          variant="outline"
                        >
                          <Save className="w-4 h-4 mr-2" />
                          Guardar Cotización
                        </Button>
                      </CardContent>
                    </Card>

                    {/* Export Cards */}
                    <Card className="bg-white rounded-xl border border-slate-200 shadow-sm">
                      <CardHeader>
                        <CardTitle className="flex items-center gap-2">
                          <Lock className="w-4 h-4" />
                          🔒 ANÁLISIS INTERNO
                        </CardTitle>
                        <CardDescription>
                          Información completa con todos los costos
                        </CardDescription>
                      </CardHeader>
                      <CardContent className="space-y-3">
                        <Button
                          variant="outline"
                          className="w-full border-[#3b1553] text-[#3b1553] hover:bg-purple-50"
                          onClick={() => copyToClipboard(generateInternalExport(), "Análisis Interno")}
                        >
                          <Copy className="w-4 h-4 mr-2" />
                          Copiar Análisis Interno
                        </Button>
                        <Button
                          variant="ghost"
                          size="sm"
                          className="w-full"
                          onClick={() => setShowInternalPreview(!showInternalPreview)}
                        >
                          <Eye className="w-4 h-4 mr-2" />
                          {showInternalPreview ? 'Ocultar' : 'Ver'} Previsualización
                        </Button>
                        {showInternalPreview && (
                          <div className="mt-3 p-3 bg-white rounded-lg border max-h-96 overflow-y-auto">
                            <pre className="text-xs whitespace-pre-wrap font-mono">
                              {generateInternalExport()}
                            </pre>
                          </div>
                        )}
                      </CardContent>
                    </Card>

                    <Card className="bg-white rounded-xl border border-slate-200 shadow-sm">
                      <CardHeader>
                        <CardTitle className="flex items-center gap-2">
                          <FileText className="w-4 h-4" />
                          📋 COTIZACIÓN CLIENTE
                        </CardTitle>
                        <CardDescription>
                          Información comercial para el cliente
                        </CardDescription>
                      </CardHeader>
                      <CardContent className="space-y-3">
                        <Button
                          variant="outline"
                          className="w-full border-[#FF6B35] text-[#FF6B35] hover:bg-orange-50"
                          onClick={() => copyToClipboard(generateClientExport(), "Cotización Cliente")}
                        >
                          <Copy className="w-4 h-4 mr-2" />
                          Copiar Cotización Cliente
                        </Button>
                        <Button
                          variant="ghost"
                          size="sm"
                          className="w-full"
                          onClick={() => setShowClientPreview(!showClientPreview)}
                        >
                          <Eye className="w-4 h-4 mr-2" />
                          {showClientPreview ? 'Ocultar' : 'Ver'} Previsualización
                        </Button>
                        {showClientPreview && (
                          <div className="mt-3 p-3 bg-white rounded-lg border max-h-96 overflow-y-auto">
                            <pre className="text-xs whitespace-pre-wrap font-mono">
                              {generateClientExport()}
                            </pre>
                          </div>
                        )}
                      </CardContent>
                    </Card>

                    <Card className="bg-white rounded-xl border border-slate-200 shadow-sm">
                      <CardHeader>
                        <CardTitle>SMS CLIENTE</CardTitle>
                        <CardDescription>
                          Mensaje corto para WhatsApp/SMS
                        </CardDescription>
                      </CardHeader>
                      <CardContent className="space-y-3">
                        <Button
                          variant="outline"
                          className="w-full border-[#9de3c1] text-[#9de3c1] hover:bg-emerald-50"
                          onClick={() => copyToClipboard(generateSMSExport(), "SMS")}
                        >
                          <Copy className="w-4 h-4 mr-2" />
                          Copiar SMS
                        </Button>
                        <Button
                          variant="ghost"
                          size="sm"
                          className="w-full"
                          onClick={() => setShowSMSPreview(!showSMSPreview)}
                        >
                          <MessageSquare className="w-4 h-4 mr-2" />
                          {showSMSPreview ? 'Ocultar' : 'Ver'} Previsualización
                        </Button>
                        {showSMSPreview && (
                          <div className="mt-3 p-3 bg-white rounded-lg border">
                            <p className="text-sm">{generateSMSExport()}</p>
                      </div>
                        )}
                  </CardContent>
                </Card>
                  </>
                )}
              </div>
            </div>
          </TabsContent>

          {/* ============================================ */}
          {/* EMBROIDERY TAB */}
          {/* ============================================ */}
          <TabsContent value="embroidery">
            <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
              {/* Left Column - Inputs */}
              <div className="lg:col-span-8 space-y-6">
                <Card className="bg-white rounded-xl border border-slate-200 shadow-sm">
                  <CardHeader>
                    <CardTitle>Configuración del Bordado</CardTitle>
                    <CardDescription>Ingresa los detalles de las gorras</CardDescription>
                  </CardHeader>
                  <CardContent className="space-y-4">
                    <div className="grid grid-cols-2 gap-4">
                      <div className="space-y-2">
                        <Label htmlFor="emb-quantity" className="text-sm font-medium text-slate-700">Cantidad</Label>
                        <Input
                          id="emb-quantity"
                          type="number"
                          value={embQuantity}
                          onChange={(e) => setEmbQuantity(Number(e.target.value))}
                          min={1}
                          className="focus:ring-2 focus:ring-primary"
                        />
                      </div>
                      <div className="space-y-2">
                        <Label htmlFor="emb-cap-cost" className="text-sm font-medium text-slate-700">Costo Gorra ($)</Label>
                        <Input
                          id="emb-cap-cost"
                          type="number"
                          step="0.01"
                          value={embCapCost}
                          onChange={(e) => setEmbCapCost(Number(e.target.value))}
                          min={0}
                          className="focus:ring-2 focus:ring-primary"
                        />
                        <p className="text-xs text-muted-foreground">Base incluida: ${CONFIG.EMB_BASE_CAP.toFixed(2)}</p>
                      </div>
                    </div>

                    <div className="space-y-2">
                      <Label htmlFor="emb-stitches" className="text-sm font-medium text-slate-700">Puntadas (Stitches)</Label>
                      <Input
                        id="emb-stitches"
                        type="number"
                        value={embStitches}
                        onChange={(e) => setEmbStitches(Number(e.target.value))}
                        min={0}
                        className="focus:ring-2 focus:ring-primary"
                      />
                      <p className="text-xs text-muted-foreground">
                        Base incluida: {CONFIG.EMB_STITCH_LIMIT.toLocaleString()} puntadas
                        {embStitches > CONFIG.EMB_STITCH_LIMIT && (
                          <span className="text-orange-600 font-medium">
                            {' '}(+{formatCurrency((Math.ceil((embStitches - CONFIG.EMB_STITCH_LIMIT) / 1000) * CONFIG.EMB_EXTRA_1K))})
                          </span>
                        )}
                      </p>
                    </div>

                    {/* Stitch Suggestions Preview */}
                    {(() => {
                      // No mostrar si no hay datos mínimos
                      if (!embQuantity || !embCapCost || !embStitches) {
                        return null;
                      }
                      
                      // Generar 3 opciones en incrementos de 1000
                      const baseStitches = Math.ceil(embStitches / 1000) * 1000;
                      const options = [];
                      
                      for (let i = 1; i <= 3; i++) {
                        const stitches = baseStitches + (i * 1000);
                        const preview = calculateStitchPreview(stitches);
                        options.push({
                          stitches,
                          perPiece: preview.perPiece,
                          total: preview.total
                        });
                      }
                      
                      return (
                        <Card className="mt-4">
                          <CardHeader>
                            <CardTitle className="text-sm">
                              💡 ¿Diseño más detallado?
                            </CardTitle>
                          </CardHeader>
                          <CardContent className="space-y-2">
                            <p className="text-xs text-gray-600 mb-2">
                              Actualmente: {embStitches.toLocaleString()} puntadas
                            </p>
                            {options.map(opt => (
                              <div 
                                key={opt.stitches}
                                className="flex justify-between items-center p-2 bg-white border rounded hover:bg-gray-50 cursor-pointer transition-colors"
                                onClick={() => {
                                  setEmbStitches(opt.stitches);
                                  toast.success('Puntadas actualizadas', {
                                    description: `Ahora tienes ${opt.stitches.toLocaleString()} puntadas`,
                                    duration: 2000,
                                  });
                                }}
                              >
                                <span className="text-sm">{opt.stitches.toLocaleString()} puntadas</span>
                                <span className="font-semibold text-sm">
                                  {formatCurrency(opt.perPiece)}/pc
                                </span>
                              </div>
                            ))}
                          </CardContent>
                        </Card>
                      );
                    })()}

                    <div className="flex items-center justify-between">
                      <div className="space-y-0.5">
                        <Label htmlFor="emb-new-logo" className="text-sm font-medium text-slate-700">Logo Nuevo (Digitizing)</Label>
                        <p className="text-sm text-muted-foreground">
                          +${CONFIG.DIGITIZING_FEE} si cantidad {'<'} {CONFIG.DIGITIZING_FREE_QTY}
                        </p>
                      </div>
                      <Switch
                        id="emb-new-logo"
                        checked={embNewLogo}
                        onCheckedChange={setEmbNewLogo}
                      />
                    </div>

                    <Separator />

                    <div className="space-y-2">
                      <Label htmlFor="emb-outbound" className="text-sm font-medium text-slate-700">Envío Outbound ($)</Label>
                      <Input
                        id="emb-outbound"
                        type="number"
                        step="0.01"
                        value={outboundShipping}
                        onChange={(e) => setOutboundShipping(Number(e.target.value))}
                        min={0}
                        className="focus:ring-2 focus:ring-primary"
                      />
                    </div>

                    <Separator />

                    {/* Markup Dropdown */}
                    <div className="space-y-2">
                      <Label htmlFor="emb-markup-select" className="text-sm font-medium text-slate-700">Markup de Ganancia</Label>
                      <select
                        id="emb-markup-select"
                        value={embMarkupType === 'preset' ? embMarkupPercent.toString() : 'custom'}
                        onChange={(e) => {
                          if (e.target.value === 'custom') {
                            setEmbMarkupType('custom');
                            setShowEmbCustomMarkupInput(true);
                          } else {
                            setEmbMarkupType('preset');
                            setEmbMarkupPercent(Number(e.target.value));
                            setShowEmbCustomMarkupInput(false);
                          }
                        }}
                        className="flex h-9 w-full rounded-md border border-input bg-transparent px-3 py-1 text-sm shadow-xs transition-colors file:border-0 file:bg-transparent file:text-sm file:font-medium placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring disabled:cursor-not-allowed disabled:opacity-50"
                      >
                        {markupPresets.map(preset => (
                          <option key={preset.value} value={preset.value}>
                            {preset.label}
                          </option>
                        ))}
                        <option value="custom">Personalizado...</option>
                      </select>

                      {showEmbCustomMarkupInput && (
                        <div className="flex gap-2">
                          <Input
                            type="number"
                            step="0.1"
                            min={0}
                            max={100}
                            value={embCustomMarkup}
                            onChange={(e) => setEmbCustomMarkup(Number(e.target.value))}
                            placeholder="0-100%"
                            className="flex-1 focus:ring-2 focus:ring-primary"
                          />
                          <Button
                            type="button"
                            onClick={() => {
                              setEmbMarkupPercent(embCustomMarkup);
                              setEmbMarkupType('preset');
                              setShowEmbCustomMarkupInput(false);
                            }}
                            size="sm"
                          >
                            Aplicar
                          </Button>
                        </div>
                      )}

                      {/* Preview de ganancia en tiempo real */}
                      {embQuantity > 0 && (
                        <div className="p-2 bg-green-50 border border-green-200 rounded-md">
                          <p className="text-sm text-green-800">
                            💰 Tu ganancia: <span className="font-semibold">+{formatCurrency(embroideryCalc.markupAmount)}</span>
                          </p>
                        </div>
                      )}
                    </div>
                  </CardContent>
                </Card>

                {/* Pricing Strategy Info */}
                <Card className="bg-white rounded-xl border border-slate-200 shadow-sm">
                  <CardHeader>
                    <CardTitle className="text-blue-900">Estrategia de Mercado</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="space-y-2 text-sm">
                      <p className="text-blue-800 font-medium">Precios Competitivos por Tier:</p>
                      {Object.entries(EMBROIDERY_SELL_TIERS).map(([qty, price]) => (
                        <div key={qty} className="flex justify-between text-blue-700">
                          <span>{qty} piezas</span>
                          <span className="font-medium">{formatCurrency(price)}</span>
                        </div>
                      ))}
                      <p className="text-xs text-blue-600 mt-2 italic">
                        * Precios incluyen gorra base y hasta 6,000 puntadas
                      </p>
                    </div>
                  </CardContent>
                </Card>
              </div>

              {/* Right Column - Summary */}
              <div className="lg:col-span-4 space-y-6 sticky top-4">
                {embroideryCalc.upsellData && (
                  <Alert className="bg-green-50 border-green-200">
                    <TrendingUp className="h-4 w-4 text-green-600" />
                    <AlertDescription className="text-green-800">
                      💡 <strong>Smart Upsell:</strong> Ahorra {formatCurrency(embroideryCalc.upsellData.savings)} por pieza 
                      pidiendo {embroideryCalc.upsellData.nextQuantity} unidades 
                      (solo {embroideryCalc.upsellData.additionalPieces} piezas más)
                    </AlertDescription>
                  </Alert>
                )}

                <Card className="bg-white rounded-xl border border-slate-200 shadow-sm">
                  <CardHeader>
                    <CardTitle>Resumen de Venta</CardTitle>
                    <CardDescription>Tier: {embroideryCalc.tier} unidades</CardDescription>
                  </CardHeader>
                  <CardContent className="space-y-4">
                    <div className="space-y-2 text-sm">
                      <div className="flex justify-between">
                        <span className="text-muted-foreground">Precio Venta/Pieza</span>
                        <span className="font-medium">{formatCurrency(embroideryCalc.sellPrice)}</span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-muted-foreground">Revenue Total</span>
                        <span className="font-medium">{formatCurrency(embroideryCalc.totalRevenue)}</span>
                      </div>
                      
                      {embCapCost > CONFIG.EMB_BASE_CAP && (
                        <div className="flex justify-between text-xs text-orange-600">
                          <span className="pl-4">• Ajuste gorra premium</span>
                          <span>+{formatCurrency((embCapCost - CONFIG.EMB_BASE_CAP) * embQuantity)}</span>
                        </div>
                      )}
                      
                      {embStitches > CONFIG.EMB_STITCH_LIMIT && (
                        <div className="flex justify-between text-xs text-orange-600">
                          <span className="pl-4">• Ajuste puntadas extra</span>
                          <span>+{formatCurrency(embroideryCalc.stitchFee * embQuantity)}</span>
                        </div>
                      )}

                      {embroideryCalc.digitizingFee > 0 && (
                        <div className="flex justify-between">
                          <span className="text-muted-foreground">Digitizing Fee</span>
                          <span className="font-medium">{formatCurrency(embroideryCalc.digitizingFee)}</span>
                        </div>
                      )}
                      
                      <div className="flex justify-between">
                        <span className="text-muted-foreground">Envío Outbound</span>
                        <span className="font-medium">{formatCurrency(outboundShipping)}</span>
                      </div>
                    </div>

                    <Separator />

                    {/* Análisis de Ganancia */}
                    <div className="bg-slate-900 text-white rounded-xl p-6 shadow-lg">
                      <div className="flex items-center gap-2 mb-4">
                        <span className="text-lg">💰</span>
                        <h3 className="font-semibold text-white">ANÁLISIS DE GANANCIA</h3>
                    </div>

                      <div className="space-y-2 text-sm">
                        <div className="flex justify-between">
                          <span className="text-white/90">Costo Base:</span>
                          <span className="font-medium text-white">{formatCurrency(embroideryCalc.baseCost)}</span>
                        </div>
                        <div className="flex justify-between">
                          <span className="text-white/90">
                            Markup ({embMarkupType === 'custom' ? embCustomMarkup : embMarkupPercent}%):
                        </span>
                          <span className="font-medium text-white">+{formatCurrency(embroideryCalc.markupAmount)}</span>
                        </div>
                        <div className="flex justify-between border-t border-white/20 pt-2">
                          <span className="text-white/90 font-medium">Subtotal:</span>
                          <span className="font-semibold text-white">{formatCurrency(embroideryCalc.subtotalWithMarkup)}</span>
                        </div>
                        <div className="flex justify-between">
                          <span className="text-white/90">Clover (4%):</span>
                          <span className="font-medium text-white">+{formatCurrency(embroideryCalc.cloverFee)}</span>
                        </div>
                            <Separator className="bg-white/20" />
                        <div className="flex justify-between items-center pt-1">
                          <span className="text-white font-semibold">TOTAL:</span>
                          <span className="text-4xl font-bold tracking-tight text-white">{formatCurrency(embroideryCalc.total)}</span>
                      </div>
                      <div className="flex justify-between text-sm">
                          <span className="text-white/90">Precio por Pieza:</span>
                          <span className="font-semibold text-white">{formatCurrency(embroideryCalc.perPiece)}</span>
                        </div>
                            <Separator className="bg-white/20" />
                        <div className="bg-white/10 rounded-md p-3 border border-white/20">
                          <div className="flex items-center justify-between">
                            <span className="text-white/90 font-semibold">Tu Ganancia:</span>
                            <span className="text-[#9de3c1] text-2xl font-bold">{formatCurrency(embroideryCalc.markupAmount)}</span>
                          </div>
                        </div>
                      </div>
                    </div>

                    <Separator />

                    {/* Export Cards */}
                    <Card className="bg-white rounded-xl border border-slate-200 shadow-sm">
                      <CardHeader>
                        <CardTitle className="flex items-center gap-2">
                          <Lock className="w-4 h-4" />
                          🔒 ANÁLISIS INTERNO
                        </CardTitle>
                        <CardDescription>
                          Información completa con todos los costos
                        </CardDescription>
                      </CardHeader>
                      <CardContent className="space-y-3">
                        <Button
                          variant="outline"
                          className="w-full border-[#3b1553] text-[#3b1553] hover:bg-purple-50"
                          onClick={() => copyToClipboard(generateInternalExportEmbroidery(), "Análisis Interno")}
                        >
                          <Copy className="w-4 h-4 mr-2" />
                          Copiar Análisis Interno
                        </Button>
                        <Button
                          variant="ghost"
                          size="sm"
                          className="w-full"
                          onClick={() => setShowInternalPreviewEmb(!showInternalPreviewEmb)}
                        >
                          <Eye className="w-4 h-4 mr-2" />
                          {showInternalPreviewEmb ? 'Ocultar' : 'Ver'} Previsualización
                        </Button>
                        {showInternalPreviewEmb && (
                          <div className="mt-3 p-3 bg-white rounded-lg border max-h-96 overflow-y-auto">
                            <pre className="text-xs whitespace-pre-wrap font-mono">
                              {generateInternalExportEmbroidery()}
                            </pre>
                          </div>
                        )}
                      </CardContent>
                    </Card>

                    <Card className="bg-white rounded-xl border border-slate-200 shadow-sm">
                      <CardHeader>
                        <CardTitle className="flex items-center gap-2">
                          <FileText className="w-4 h-4" />
                          📋 COTIZACIÓN CLIENTE
                        </CardTitle>
                        <CardDescription>
                          Información comercial para el cliente
                        </CardDescription>
                      </CardHeader>
                      <CardContent className="space-y-3">
                        <Button
                          variant="outline"
                          className="w-full border-[#FF6B35] text-[#FF6B35] hover:bg-orange-50"
                          onClick={() => copyToClipboard(generateClientExportEmbroidery(), "Cotización Cliente")}
                        >
                          <Copy className="w-4 h-4 mr-2" />
                          Copiar Cotización Cliente
                        </Button>
                        <Button
                          variant="ghost"
                          size="sm"
                          className="w-full"
                          onClick={() => setShowClientPreviewEmb(!showClientPreviewEmb)}
                        >
                          <Eye className="w-4 h-4 mr-2" />
                          {showClientPreviewEmb ? 'Ocultar' : 'Ver'} Previsualización
                        </Button>
                        {showClientPreviewEmb && (
                          <div className="mt-3 p-3 bg-white rounded-lg border max-h-96 overflow-y-auto">
                            <pre className="text-xs whitespace-pre-wrap font-mono">
                              {generateClientExportEmbroidery()}
                            </pre>
                          </div>
                        )}
                      </CardContent>
                    </Card>

                    <Card className="bg-white rounded-xl border border-slate-200 shadow-sm">
                      <CardHeader>
                        <CardTitle>SMS CLIENTE</CardTitle>
                        <CardDescription>
                          Mensaje corto para WhatsApp/SMS
                        </CardDescription>
                      </CardHeader>
                      <CardContent className="space-y-3">
                        <Button
                          variant="outline"
                          className="w-full border-[#9de3c1] text-[#9de3c1] hover:bg-emerald-50"
                          onClick={() => copyToClipboard(generateSMSExportEmbroidery(), "SMS")}
                        >
                          <Copy className="w-4 h-4 mr-2" />
                          Copiar SMS
                        </Button>
                        <Button
                          variant="ghost"
                          size="sm"
                          className="w-full"
                          onClick={() => setShowSMSPreviewEmb(!showSMSPreviewEmb)}
                        >
                          <MessageSquare className="w-4 h-4 mr-2" />
                          {showSMSPreviewEmb ? 'Ocultar' : 'Ver'} Previsualización
                        </Button>
                        {showSMSPreviewEmb && (
                          <div className="mt-3 p-3 bg-white rounded-lg border">
                            <p className="text-sm">{generateSMSExportEmbroidery()}</p>
                      </div>
                        )}
                      </CardContent>
                    </Card>
                  </CardContent>
                </Card>
              </div>
            </div>
          </TabsContent>

          {/* ============================================ */}
          {/* SAVED QUOTATIONS TAB */}
          {/* ============================================ */}
          <TabsContent value="saved">
            <Card className="bg-white rounded-xl border border-slate-200 shadow-sm">
              <CardHeader>
                <CardTitle>Cotizaciones Guardadas</CardTitle>
                <CardDescription>
                  {savedQuotations.length} cotización{savedQuotations.length !== 1 ? 'es' : ''} guardada{savedQuotations.length !== 1 ? 's' : ''}
                </CardDescription>
              </CardHeader>
              <CardContent>
                {savedQuotations.length === 0 ? (
                  <div className="text-center py-12 text-muted-foreground">
                    No hay cotizaciones guardadas
                  </div>
                ) : (
                  <div className="space-y-4">
                    {savedQuotations.map((quotation) => (
                      <div
                        key={quotation.id}
                        className="p-4 border rounded-lg hover:bg-slate-50 transition-colors"
                      >
                        <div className="flex items-start justify-between">
                          <div className="flex-1">
                            <div className="flex items-center gap-2 mb-2">
                              <h3 className="font-semibold text-lg">{quotation.clientName}</h3>
                              <span className="text-sm text-muted-foreground">-</span>
                              <span className="text-sm text-muted-foreground">{quotation.businessName}</span>
                            </div>
                            <div className="flex flex-wrap gap-4 text-sm text-muted-foreground mb-2">
                              <div className="flex items-center gap-1">
                                <Calendar className="w-4 h-4" />
                                {new Date(quotation.date).toLocaleDateString('es-ES')}
                              </div>
                              <div>
                                {quotation.items.length} item{quotation.items.length !== 1 ? 's' : ''} | {quotation.totals.totalPieces} piezas
                              </div>
                              <div>
                                Tier: {quotation.globalTier}
                              </div>
                              <div>
                                Creado por: {quotation.createdBy}
                              </div>
                            </div>
                            <div className="text-lg font-bold text-blue-600">
                              {formatCurrency(quotation.totals.total)}
                            </div>
                          </div>
                          <div className="flex gap-2 ml-4">
                            <Button
                              variant="outline"
                              size="sm"
                              onClick={() => handleLoadQuotation(quotation)}
                            >
                              <Eye className="w-4 h-4 mr-2" />
                              Cargar
                            </Button>
                            <Button
                              variant="destructive"
                              size="sm"
                              onClick={() => handleDeleteQuotation(quotation.id)}
                            >
                              <Trash2 className="w-4 h-4 mr-2" />
                              Eliminar
                            </Button>
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>
      </div>
      <Toaster />
    </div>
  );
}
