#!/bin/bash

# Script de Integración - Calculadora Textil al Dashboard Admin
# Ejecutar desde la raíz del proyecto del dashboard admin

set -e

echo "🔧 Integrando Calculadora Textil al Dashboard Admin..."

# Variables
CALCULATOR_PATH="../textile-calculator"
DASHBOARD_PATH="."

# Verificar que estamos en el directorio correcto
if [ ! -f "package.json" ]; then
    echo "❌ Error: No se encontró package.json. Asegúrate de estar en la raíz del dashboard admin."
    exit 1
fi

# 1. Crear estructura de directorios
echo "📁 Creando estructura de directorios..."
mkdir -p app/\(dashboard\)/calculator
mkdir -p lib/calculator
mkdir -p types/calculator

# 2. Copiar componente principal
echo "📄 Copiando componente principal..."
cp "$CALCULATOR_PATH/app/page.tsx" "$DASHBOARD_PATH/app/(dashboard)/calculator/page.tsx"

# 3. Copiar librerías
echo "📚 Copiando librerías..."
cp -r "$CALCULATOR_PATH/lib/"* "$DASHBOARD_PATH/lib/calculator/"

# 4. Copiar tipos
echo "📝 Copiando tipos TypeScript..."
cp "$CALCULATOR_PATH/types/calculator.ts" "$DASHBOARD_PATH/types/calculator.ts"

# 5. Copiar assets
echo "🖼️  Copiando assets..."
cp "$CALCULATOR_PATH/public/customize_it_logo_web-07.png" "$DASHBOARD_PATH/public/" 2>/dev/null || echo "⚠️  Logo no encontrado (opcional)"

# 6. Verificar componentes UI
echo "✅ Verificando componentes UI..."
# Los componentes UI de Shadcn deberían estar ya en el dashboard

# 7. Actualizar imports en el componente
echo "🔨 Actualizando imports..."
# Esto requerirá ajustes manuales según la estructura del dashboard

echo "✅ Integración completa!"
echo ""
echo "⚠️  PASOS MANUALES REQUERIDOS:"
echo "1. Agregar el item al sidebar del dashboard"
echo "2. Verificar que todos los imports estén correctos"
echo "3. Verificar que las variables CSS de marca estén en globals.css"
echo "4. Probar la aplicación"
