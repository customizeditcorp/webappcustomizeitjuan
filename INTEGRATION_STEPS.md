# Pasos de Integración - Calculadora al Dashboard Admin

## 📋 Preparación

### Opción A: Si tienes el repositorio de GitHub
1. Clona el repositorio del dashboard admin
2. Ejecuta el script de integración
3. Agrega el item al sidebar

### Opción B: Si NO tienes el repositorio
1. Desde Vercel Dashboard → Settings → Git → obtén la URL del repositorio
2. O si el proyecto está en GitHub, busca: `next-js-and-shadcn-ui-admin-dashboard`
3. Clónalo localmente

## 🔧 Pasos de Integración Manual

### 1. Crear la ruta en el dashboard
```bash
# En el directorio del dashboard admin
mkdir -p app/(dashboard)/calculator
```

### 2. Copiar archivos necesarios

Desde este proyecto (`textile-calculator`) al dashboard:

**Componente principal:**
- `app/page.tsx` → `app/(dashboard)/calculator/page.tsx`

**Librerías:**
- `lib/auth.ts` → `lib/calculator/auth.ts`
- `lib/calculations.ts` → `lib/calculator/calculations.ts`
- `lib/constants.ts` → `lib/calculator/constants.ts`
- `lib/formatters.ts` → `lib/calculator/formatters.ts`
- `lib/storage.ts` → `lib/calculator/storage.ts`
- `lib/utils.ts` → (solo si no existe en el dashboard)

**Tipos:**
- `types/calculator.ts` → `types/calculator.ts`

**Assets:**
- `public/customize_it_logo_web-07.png` → `public/customize_it_logo_web-07.png`

### 3. Actualizar imports en el componente

En `app/(dashboard)/calculator/page.tsx`, cambiar:
```typescript
// Cambiar estos imports:
from '@/lib/auth' → from '@/lib/calculator/auth'
from '@/lib/calculations' → from '@/lib/calculator/calculations'
from '@/lib/constants' → from '@/lib/calculator/constants'
from '@/lib/formatters' → from '@/lib/calculator/formatters'
from '@/lib/storage' → from '@/lib/calculator/storage'
```

### 4. Agregar al Sidebar

Buscar el archivo de configuración del sidebar (probablemente en `components/sidebar.tsx` o `lib/sidebar-config.ts`) y agregar:

```typescript
{
  title: "Calculadora",
  url: "/calculator",
  icon: Calculator, // o Shirt, de lucide-react
}
```

### 5. Agregar variables CSS de marca

En `app/globals.css` del dashboard, agregar:

```css
/* Customize It! Brand Colors */
--color-customize-orange: #FF6B35;
--color-customize-orange-light: #FF8C61;
--color-customize-purple: #3b1553;
--color-customize-purple-dark: #3f133a;
--color-customize-mint: #9de3c1;
--color-customize-gray-mouse: #6B7280;
```

### 6. Verificar dependencias

Asegurar que el dashboard tenga todas las dependencias necesarias:
- `sonner` (para toasts)
- `next-themes` (para ThemeProvider)
- Todos los componentes Shadcn UI necesarios

### 7. Probar localmente

```bash
cd <dashboard-admin-directory>
npm install
npm run dev
```

Navegar a: `http://localhost:3000/calculator`

## ⚠️ Problemas Comunes

### Si hay errores de imports:
- Verificar que las rutas de `@/lib/calculator/...` sean correctas
- Verificar `tsconfig.json` que tenga los paths configurados

### Si faltan componentes UI:
- Instalar con: `npx shadcn@latest add [component-name]`

### Si los estilos no se ven:
- Verificar que `globals.css` incluya las variables de marca
- Verificar configuración de Tailwind CSS

## 📝 Notas

- La calculadora es completamente client-side
- Usa `localStorage` para autenticación y almacenamiento
- No requiere API backend
- Los usuarios están hardcodeados en `lib/calculator/auth.ts`
