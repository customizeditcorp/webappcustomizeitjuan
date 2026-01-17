# Guía de Integración - Calculadora Textil al Dashboard Admin

## 📦 Archivos Necesarios para Integración

### Componente Principal
- `app/page.tsx` - Componente completo de la calculadora

### Componentes UI (Shadcn)
- `components/ui/*` - Todos los componentes UI necesarios

### Librerías y Utilidades
- `lib/auth.ts` - Sistema de autenticación
- `lib/calculations.ts` - Lógica de cálculos
- `lib/constants.ts` - Constantes de configuración
- `lib/formatters.ts` - Formateo de moneda
- `lib/storage.ts` - Almacenamiento local
- `lib/utils.ts` - Utilidades generales

### Tipos TypeScript
- `types/calculator.ts` - Definiciones de tipos

### Assets
- `public/customize_it_logo_web-07.png` - Logo de la marca

### Configuración
- `app/globals.css` - Estilos globales y variables CSS de marca
- `components.json` - Configuración de Shadcn

## 🔧 Pasos de Integración

### Opción 1: Integrar como Nueva Ruta en Dashboard

1. **Crear la ruta en el dashboard:**
   ```
   app/(dashboard)/calculator/page.tsx
   ```

2. **Copiar el componente:**
   - Copiar `app/page.tsx` completo
   - Ajustar imports si es necesario

3. **Copiar dependencias:**
   - Copiar toda la carpeta `lib/`
   - Copiar toda la carpeta `types/`
   - Copiar componentes UI que falten en `components/ui/`

4. **Agregar al Sidebar:**
   ```typescript
   {
     title: "Calculadora",
     url: "/calculator",
     icon: Calculator, // o Shirt, o el icono que prefieras
   }
   ```

5. **Copiar assets:**
   - Copiar logo a `public/` del dashboard

6. **Verificar estilos:**
   - Asegurar que `globals.css` incluya las variables de color de Customize It!
   - Verificar que Tailwind esté configurado correctamente

### Opción 2: Mantener como Proyecto Separado

Si prefieres mantenerlos separados, puedes:
- Dejar la calculadora en su propio proyecto
- Crear un enlace desde el dashboard que apunte a la calculadora
- O usar iframe (no recomendado)

## ✅ Checklist de Verificación

- [ ] Todos los componentes UI están disponibles
- [ ] Las rutas de imports están correctas (`@/lib`, `@/components`, etc.)
- [ ] El logo está en la carpeta public
- [ ] Los estilos de marca están aplicados
- [ ] La autenticación funciona correctamente
- [ ] Los cálculos funcionan como esperado
- [ ] El almacenamiento local funciona
- [ ] Todos los textos son visibles (colores correctos)

## 🎨 Variables CSS de Marca (Customize It!)

Asegúrate de incluir estas variables en el `globals.css` del dashboard:

```css
--color-customize-orange: #FF6B35;
--color-customize-orange-light: #FF8C61;
--color-customize-purple: #3b1553;
--color-customize-purple-dark: #3f133a;
--color-customize-mint: #9de3c1;
--color-customize-gray-mouse: #6B7280;
```

## 📝 Notas Importantes

- La calculadora usa `localStorage` para autenticación y almacenamiento
- Los usuarios están hardcodeados en `lib/auth.ts` (para desarrollo)
- La calculadora es completamente client-side (no necesita API)
- Todos los textos tienen colores explícitos para visibilidad
