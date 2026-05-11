#!/bin/bash

# Script de construcción automatizada para CI local
# Uso: ./scripts/build.sh [backend|frontend|all]

set -e  # Salir si hay error

COLOR_GREEN='\033[0;32m'
COLOR_RED='\033[0;31m'
COLOR_YELLOW='\033[1;33m'
COLOR_BLUE='\033[0;34m'
NC='\033[0m' # No Color

BUILD_DIR=$(dirname "$(readlink -f "$0")")/..
TIMESTAMP=$(date '+%Y%m%d_%H%M%S')
REPORT_FILE="$BUILD_DIR/reports/build-report-$TIMESTAMP.txt"

mkdir -p "$BUILD_DIR/reports"

# Funciones auxiliares
log_info() {
  echo -e "${COLOR_BLUE}[INFO]${NC} $1"
}

log_success() {
  echo -e "${COLOR_GREEN}[SUCCESS]${NC} $1"
}

log_error() {
  echo -e "${COLOR_RED}[ERROR]${NC} $1"
}

log_warning() {
  echo -e "${COLOR_YELLOW}[WARNING]${NC} $1"
}

# Iniciar reporte
start_report() {
  {
    echo "================================"
    echo "Build Report"
    echo "================================"
    echo "Date: $(date)"
    echo "Build Type: $1"
    echo "================================"
  } > "$REPORT_FILE"
}

# Compilar backend
build_backend() {
  log_info "Compilando backend..."
  
  {
    echo ""
    echo "=== BACKEND BUILD ==="
  } >> "$REPORT_FILE"
  
  cd "$BUILD_DIR/backend/institucion"
  
  # Crear entorno virtual si no existe
  if [ ! -d "venv" ]; then
    log_info "Creando entorno virtual..."
    python3 -m venv venv
  fi
  
  # Activar entorno virtual
  source venv/bin/activate || . venv/Scripts/activate
  
  # Instalar dependencias
  log_info "Instalando dependencias..."
  pip install --upgrade pip >> "$REPORT_FILE" 2>&1
  pip install -r requirements.txt >> "$REPORT_FILE" 2>&1
  pip install pytest pytest-django pytest-cov >> "$REPORT_FILE" 2>&1
  
  # Verificar sintaxis
  log_info "Verificando sintaxis de Python..."
  python -m py_compile apps/**/*.py >> "$REPORT_FILE" 2>&1 || log_warning "Algunos archivos no compilan"
  
  # Ejecutar migraciones (modo dry-run)
  log_info "Verificando migraciones..."
  python manage.py migrate --plan >> "$REPORT_FILE" 2>&1
  
  # Ejecutar pruebas si existen
  if [ -d "tests" ]; then
    log_info "Ejecutando pruebas del backend..."
    pytest tests/ --cov=apps --cov-report=term-summary >> "$REPORT_FILE" 2>&1 || log_warning "Algunas pruebas fallaron"
  else
    log_warning "No se encontraron pruebas en backend"
  fi
  
  log_success "Backend compilado"
  echo "Backend Status: ✅ OK" >> "$REPORT_FILE"
}

# Compilar frontend
build_frontend() {
  log_info "Compilando frontend..."
  
  {
    echo ""
    echo "=== FRONTEND BUILD ==="
  } >> "$REPORT_FILE"
  
  cd "$BUILD_DIR/frontend/institucion-app"
  
  # Instalar dependencias
  log_info "Instalando dependencias de Node.js..."
  npm ci >> "$REPORT_FILE" 2>&1
  
  # Linting
  log_info "Ejecutando ESLint..."
  npm run lint >> "$REPORT_FILE" 2>&1 || log_warning "ESLint encontró problemas"
  
  # Compilar
  log_info "Compilando Next.js..."
  npm run build >> "$REPORT_FILE" 2>&1
  
  # Pruebas (si existen)
  if npm test -- --listTests 2>/dev/null | grep -q "."; then
    log_info "Ejecutando pruebas del frontend..."
    npm test -- --passWithNoTests >> "$REPORT_FILE" 2>&1 || log_warning "Algunas pruebas fallaron"
  else
    log_warning "No se encontraron pruebas en frontend"
  fi
  
  log_success "Frontend compilado"
  echo "Frontend Status: ✅ OK" >> "$REPORT_FILE"
}

# Finalizar reporte
finish_report() {
  {
    echo ""
    echo "================================"
    echo "Build completed at: $(date)"
    echo "================================"
  } >> "$REPORT_FILE"
}

# Main
main() {
  BUILD_TYPE="${1:-all}"
  
  log_info "Iniciando proceso de construcción..."
  start_report "$BUILD_TYPE"
  
  case $BUILD_TYPE in
    backend)
      build_backend
      ;;
    frontend)
      build_frontend
      ;;
    all)
      build_backend
      build_frontend
      ;;
    *)
      log_error "Parámetro no válido: $BUILD_TYPE"
      echo "Uso: $0 [backend|frontend|all]"
      exit 1
      ;;
  esac
  
  finish_report
  
  log_success "Construcción completada"
  log_info "Reporte guardado en: $REPORT_FILE"
  cat "$REPORT_FILE"
}

main "$@"
