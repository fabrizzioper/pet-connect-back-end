#!/bin/bash

# Script para probar endpoints como ADMINISTRADOR
# Acceso completo al sistema, puede gestionar todo

BASE_URL="${1:-http://localhost:3000}"
API_URL="${BASE_URL}/api"

# Colores para output
GREEN='\033[0;32m'
RED='\033[0;31m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

# Variables para almacenar datos
ADMIN_TOKEN=""
ADMIN_ID=""
USER_TOKEN=""
USER_ID=""
PET_ID=""
POST_ID=""
COMMENT_ID=""
CATEGORY_ID=""

# Contadores
PASSED=0
FAILED=0

# Función para hacer requests
make_request() {
    local method=$1
    local endpoint=$2
    local data=$3
    local auth=$4
    local description=$5
    
    echo -e "${BLUE}Testing: ${description}${NC}"
    echo -e "  ${YELLOW}${method} ${endpoint}${NC}"
    
    if [ "$method" = "GET" ]; then
        if [ -n "$auth" ]; then
            response=$(curl -s -w "\n%{http_code}" -X GET "${API_URL}${endpoint}" \
                -H "Authorization: Bearer ${auth}" \
                -H "Content-Type: application/json")
        else
            response=$(curl -s -w "\n%{http_code}" -X GET "${API_URL}${endpoint}" \
                -H "Content-Type: application/json")
        fi
    elif [ "$method" = "POST" ]; then
        if [ -n "$auth" ]; then
            response=$(curl -s -w "\n%{http_code}" -X POST "${API_URL}${endpoint}" \
                -H "Authorization: Bearer ${auth}" \
                -H "Content-Type: application/json" \
                -d "${data}")
        else
            response=$(curl -s -w "\n%{http_code}" -X POST "${API_URL}${endpoint}" \
                -H "Content-Type: application/json" \
                -d "${data}")
        fi
    elif [ "$method" = "PUT" ]; then
        response=$(curl -s -w "\n%{http_code}" -X PUT "${API_URL}${endpoint}" \
            -H "Authorization: Bearer ${auth}" \
            -H "Content-Type: application/json" \
            -d "${data}")
    elif [ "$method" = "DELETE" ]; then
        response=$(curl -s -w "\n%{http_code}" -X DELETE "${API_URL}${endpoint}" \
            -H "Authorization: Bearer ${auth}" \
            -H "Content-Type: application/json")
    fi
    
    http_code=$(echo "$response" | tail -n1)
    body=$(echo "$response" | sed '$d')
    
    if [ "$http_code" -ge 200 ] && [ "$http_code" -lt 300 ]; then
        echo -e "  ${GREEN}✓ PASSED (${http_code})${NC}"
        ((PASSED++))
        echo "$body" | jq '.' 2>/dev/null || echo "$body"
        return 0
    else
        echo -e "  ${RED}✗ FAILED (${http_code})${NC}"
        echo "$body" | jq '.' 2>/dev/null || echo "$body"
        ((FAILED++))
        return 1
    fi
}

# Verificar que curl esté instalado
if ! command -v curl &> /dev/null; then
    echo -e "${RED}Error: curl no está instalado${NC}"
    exit 1
fi

echo -e "${BLUE}========================================${NC}"
echo -e "${BLUE}PetConnect - Pruebas como ADMINISTRADOR${NC}"
echo -e "${BLUE}========================================${NC}"
echo -e "Base URL: ${BASE_URL}"
echo ""

# ============================================
# 1. LOGIN COMO ADMIN (creado automáticamente)
# ============================================
echo -e "${YELLOW}=== AUTENTICACIÓN ADMIN ===${NC}"

# Leer credenciales del .env si existe, sino usar valores por defecto
if [ -f .env ]; then
    ADMIN_EMAIL=$(grep "^ADMIN_EMAIL=" .env | cut -d '=' -f2 | tr -d '"' | tr -d "'")
    ADMIN_PASSWORD=$(grep "^ADMIN_PASSWORD=" .env | cut -d '=' -f2 | tr -d '"' | tr -d "'")
fi

# Valores por defecto si no están en .env
ADMIN_EMAIL=${ADMIN_EMAIL:-"admin@petconnect.com"}
ADMIN_PASSWORD=${ADMIN_PASSWORD:-"Admin1234"}

echo -e "${BLUE}Usando credenciales de admin del .env${NC}"
echo -e "${YELLOW}Email: ${ADMIN_EMAIL}${NC}"

# Intentar login como admin (debe existir si CREATE_ADMIN=true)
make_request "POST" "/auth/login" \
    "{\"email\":\"${ADMIN_EMAIL}\",\"password\":\"${ADMIN_PASSWORD}\"}" \
    "" \
    "Login como administrador"

ADMIN_TOKEN=$(echo "$body" | jq -r '.token' 2>/dev/null)
ADMIN_ID=$(echo "$body" | jq -r '.user._id' 2>/dev/null)

# Si el login falla, el admin no existe aún (puede tardar unos segundos en crearse)
if [ -z "$ADMIN_TOKEN" ] || [ "$ADMIN_TOKEN" = "null" ]; then
    echo -e "${YELLOW}Admin aún no existe o credenciales incorrectas. Esperando 3 segundos...${NC}"
    sleep 3
    
    # Intentar nuevamente
    make_request "POST" "/auth/login" \
        "{\"email\":\"${ADMIN_EMAIL}\",\"password\":\"${ADMIN_PASSWORD}\"}" \
        "" \
        "Reintentar login como administrador"
    
    ADMIN_TOKEN=$(echo "$body" | jq -r '.token' 2>/dev/null)
    ADMIN_ID=$(echo "$body" | jq -r '.user._id' 2>/dev/null)
fi

# Verificar que el login fue exitoso
if [ -z "$ADMIN_TOKEN" ] || [ "$ADMIN_TOKEN" = "null" ]; then
    echo -e "${RED}✗ Error: No se pudo autenticar como administrador${NC}"
    echo -e "${YELLOW}Verifica que CREATE_ADMIN=true en el .env y que las credenciales sean correctas${NC}"
    echo -e "${YELLOW}El admin se crea automáticamente al iniciar el backend${NC}"
    exit 1
fi

echo -e "${GREEN}✓ Login exitoso como administrador${NC}"
echo -e "${BLUE}Admin ID: ${ADMIN_ID}${NC}"

echo ""

# ============================================
# 2. CREAR USUARIO NORMAL PARA PRUEBAS
# ============================================
echo -e "${YELLOW}=== CREAR USUARIO NORMAL PARA PRUEBAS ===${NC}"

# Generar username y email únicos usando timestamp
TIMESTAMP=$(date +%s)
USERNAME="user_admin_${TIMESTAMP}"
EMAIL="useradmin_${TIMESTAMP}@test.com"

make_request "POST" "/auth/register" \
    "{\"username\":\"${USERNAME}\",\"email\":\"${EMAIL}\",\"password\":\"User1234\",\"fullName\":\"Usuario Normal Test\"}" \
    "" \
    "Crear usuario normal para pruebas"

USER_TOKEN=$(echo "$body" | jq -r '.token' 2>/dev/null)
USER_ID=$(echo "$body" | jq -r '.user._id' 2>/dev/null)

# Crear contenido del usuario normal
if [ -n "$USER_TOKEN" ] && [ "$USER_TOKEN" != "null" ]; then
    # Crear mascota
    make_request "POST" "/pets" \
        '{"name":"Rex","type":"dog","breed":"Labrador","age":4,"description":"Perro de prueba"}' \
        "$USER_TOKEN" \
        "Crear mascota (usuario normal)"
    
    PET_ID=$(echo "$body" | jq -r '.pet._id' 2>/dev/null)
    
    # Crear publicación
    if [ -n "$PET_ID" ] && [ "$PET_ID" != "null" ]; then
        make_request "POST" "/posts" \
            "{\"content\":\"Publicación de prueba para admin\",\"petId\":\"${PET_ID}\",\"category\":\"dog\"}" \
            "$USER_TOKEN" \
            "Crear publicación (usuario normal)"
        
        POST_ID=$(echo "$body" | jq -r '.post._id' 2>/dev/null)
        
        # Crear comentario
        if [ -n "$POST_ID" ] && [ "$POST_ID" != "null" ]; then
            make_request "POST" "/posts/${POST_ID}/comments" \
                '{"content":"Comentario de prueba"}' \
                "$USER_TOKEN" \
                "Crear comentario (usuario normal)"
            
            COMMENT_ID=$(echo "$body" | jq -r '.comment._id' 2>/dev/null)
        fi
    fi
fi

echo ""

# ============================================
# 3. PANEL DE ADMINISTRACIÓN
# ============================================
echo -e "${YELLOW}=== PANEL DE ADMINISTRACIÓN ===${NC}"

# 3.1 Obtener estadísticas
make_request "GET" "/admin/statistics" \
    "" \
    "$ADMIN_TOKEN" \
    "Obtener estadísticas generales"

# 3.2 Obtener reportes
make_request "GET" "/admin/reports?page=1&limit=10" \
    "" \
    "$ADMIN_TOKEN" \
    "Obtener todos los reportes"

echo ""

# ============================================
# 4. GESTIÓN DE CONTENIDO
# ============================================
echo -e "${YELLOW}=== GESTIÓN DE CONTENIDO ===${NC}"

# 4.1 Eliminar publicación (admin)
if [ -n "$POST_ID" ] && [ "$POST_ID" != "null" ]; then
    make_request "DELETE" "/admin/posts/${POST_ID}" \
        '{"reason":"Publicación eliminada por administrador"}' \
        "$ADMIN_TOKEN" \
        "Eliminar publicación como admin"
fi

# 4.2 Eliminar comentario (admin)
if [ -n "$COMMENT_ID" ] && [ "$COMMENT_ID" != "null" ]; then
    make_request "DELETE" "/admin/comments/${COMMENT_ID}" \
        "" \
        "$ADMIN_TOKEN" \
        "Eliminar comentario como admin"
fi

echo ""

# ============================================
# 5. GESTIÓN DE USUARIOS
# ============================================
echo -e "${YELLOW}=== GESTIÓN DE USUARIOS ===${NC}"

# 5.1 Bloquear usuario
if [ -n "$USER_ID" ] && [ "$USER_ID" != "null" ]; then
    make_request "PUT" "/admin/users/${USER_ID}/block" \
        '{"blocked":true,"reason":"Usuario bloqueado para pruebas"}' \
        "$ADMIN_TOKEN" \
        "Bloquear usuario"
    
    # 5.2 Desbloquear usuario
    make_request "PUT" "/admin/users/${USER_ID}/block" \
        '{"blocked":false,"reason":"Usuario desbloqueado"}' \
        "$ADMIN_TOKEN" \
        "Desbloquear usuario"
fi

echo ""

# ============================================
# 6. GESTIÓN DE CATEGORÍAS
# ============================================
echo -e "${YELLOW}=== GESTIÓN DE CATEGORÍAS ===${NC}"

# 6.1 Crear categoría
make_request "POST" "/categories" \
    '{"name":"reptiles","displayName":"Reptiles","description":"Publicaciones sobre reptiles","icon":"https://example.com/reptiles.png"}' \
    "$ADMIN_TOKEN" \
    "Crear nueva categoría"

CATEGORY_ID=$(echo "$body" | jq -r '.category._id' 2>/dev/null)

# 6.2 Obtener todas las categorías
make_request "GET" "/categories" \
    "" \
    "" \
    "Obtener todas las categorías"

# 6.3 Actualizar categoría
if [ -n "$CATEGORY_ID" ] && [ "$CATEGORY_ID" != "null" ]; then
    make_request "PUT" "/categories/${CATEGORY_ID}" \
        '{"displayName":"Reptiles Actualizado","description":"Descripción actualizada"}' \
        "$ADMIN_TOKEN" \
        "Actualizar categoría"
    
    # 6.4 Desactivar categoría
    make_request "DELETE" "/categories/${CATEGORY_ID}" \
        "" \
        "$ADMIN_TOKEN" \
        "Desactivar categoría"
fi

echo ""

# ============================================
# 7. VERIFICAR ACCESO COMPLETO
# ============================================
echo -e "${YELLOW}=== VERIFICAR ACCESO COMPLETO ===${NC}"

# Admin puede hacer todo lo que un usuario normal puede hacer
# 7.1 Ver perfil propio
make_request "GET" "/users/me" \
    "" \
    "$ADMIN_TOKEN" \
    "Ver perfil propio (admin)"

# 7.2 Crear publicación
make_request "POST" "/posts" \
    '{"content":"Publicación creada por admin","category":"dog"}' \
    "$ADMIN_TOKEN" \
    "Crear publicación (admin puede crear contenido)"

# 7.3 Ver feed
make_request "GET" "/posts/feed?page=1&limit=10" \
    "" \
    "$ADMIN_TOKEN" \
    "Ver feed (admin tiene acceso completo)"

echo ""

# ============================================
# RESUMEN
# ============================================
echo ""
echo -e "${BLUE}========================================${NC}"
echo -e "${BLUE}RESUMEN DE PRUEBAS - ADMINISTRADOR${NC}"
echo -e "${BLUE}========================================${NC}"
echo -e "${GREEN}Pruebas exitosas: ${PASSED}${NC}"
echo -e "${RED}Pruebas fallidas: ${FAILED}${NC}"
echo -e "${BLUE}Total: $((PASSED + FAILED))${NC}"
echo ""
echo -e "${YELLOW}Nota: El admin se crea automáticamente al iniciar el backend${NC}"
echo -e "${YELLOW}Configura CREATE_ADMIN=true y las credenciales en el .env${NC}"
echo ""

if [ $FAILED -eq 0 ]; then
    echo -e "${GREEN}¡Todas las pruebas pasaron!${NC}"
    exit 0
else
    echo -e "${RED}Algunas pruebas fallaron${NC}"
    exit 1
fi

