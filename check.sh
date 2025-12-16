#!/bin/bash
# Script de verificación rápida antes de presentar

echo "🔍 Verificando estructura del proyecto..."
echo ""

# Verificar archivos críticos
echo "✅ Verificando archivos necesarios:"
files=(
  "app/page.tsx"
  "app/layout.tsx"
  "app/globals.css"
  "components/TurnoButton.tsx"
  "components/ClientRegistration.tsx"
  "components/Sidebar.tsx"
  "firebase/client-config.ts"
  "tailwind.config.ts"
  "package.json"
  "tsconfig.json"
)

for file in "${files[@]}"; do
  if [ -f "$file" ]; then
    echo "  ✓ $file"
  else
    echo "  ✗ FALTA: $file"
  fi
done

echo ""
echo "📦 Dependencias instaladas:"
if [ -d "node_modules" ]; then
  echo "  ✓ node_modules existe"
  echo "  ✓ Puedes ejecutar: npm run dev"
else
  echo "  ✗ Falta instalar: npm install"
fi

echo ""
echo "🚀 Para ejecutar:"
echo "  npm install  (si no lo hiciste)"
echo "  npm run dev"
echo ""
echo "Luego abre: http://localhost:3000"
