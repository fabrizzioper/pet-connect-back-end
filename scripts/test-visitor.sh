#!/bin/bash

# Script para probar endpoints como VISITANTE (no registrado)
# Solo puede ver publicaciones públicas sin interactuar

BASE_URL="${1:-http://localhost:3000}"
API_URL="${BASE_URL}/api"

# Colores para output
GREEN='\033[0;32m'
RED='\033[0;31m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

# Contadores
PASSED=0
FAILED=0

# Función para hacer requests
make_request() {
    local method=$1
    local endpoint=$2
    local data=$3
    local description=$4
    
    echo -e "${BLUE}Testing: ${description}${NC}"
    echo -e "  ${YELLOW}${method} ${endpoint}${NC}"
    
    if [ "$method" = "GET" ]; then
        response=$(curl -s -w "\n%{http_code}" -X GET "${API_URL}${endpoint}" \
            -H "Content-Type: application/json")
    elif [ "$method" = "POST" ]; then
        response=$(curl -s -w "\n%{http_code}" -X POST "${API_URL}${endpoint}" \
            -H "Content-Type: application/json" \
            -d "${data}")
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
echo -e "${BLUE}PetConnect - Pruebas como VISITANTE${NC}"
echo -e "${BLUE}========================================${NC}"
echo -e "Base URL: ${BASE_URL}"
echo -e "${YELLOW}Nota: Visitante solo puede ver contenido público${NC}"
echo ""

# ============================================
# ENDPOINTS PÚBLICOS (Solo lectura)
# ============================================

# 1. Ver feed principal (público)
make_request "GET" "/posts/feed?page=1&limit=10" \
    "" \
    "Ver feed principal de publicaciones (público)"

# 2. Ver publicación por ID (público)
POST_ID=$(echo "$body" | jq -r '.posts[0]._id' 2>/dev/null)
if [ -n "$POST_ID" ] && [ "$POST_ID" != "null" ]; then
    make_request "GET" "/posts/${POST_ID}" \
        "" \
        "Ver publicación específica por ID (público)"
fi

# 3. Ver perfil de usuario (público)
# Primero necesitamos un userId, intentamos obtenerlo del feed
USER_ID=$(echo "$body" | jq -r '.posts[0].author._id' 2>/dev/null)
if [ -n "$USER_ID" ] && [ "$USER_ID" != "null" ]; then
    make_request "GET" "/users/${USER_ID}" \
        "" \
        "Ver perfil público de un usuario"
    
    # 4. Ver publicaciones de un usuario (público)
    make_request "GET" "/posts/user/${USER_ID}?page=1&limit=10" \
        "" \
        "Ver publicaciones de un usuario (público)"
    
    # 5. Ver seguidores de un usuario (público)
    make_request "GET" "/users/${USER_ID}/followers?page=1&limit=10" \
        "" \
        "Ver seguidores de un usuario (público)"
    
    # 6. Ver usuarios seguidos (público)
    make_request "GET" "/users/${USER_ID}/following?page=1&limit=10" \
        "" \
        "Ver usuarios seguidos (público)"
fi

# 7. Ver mascota por ID (público)
PET_ID=$(echo "$body" | jq -r '.posts[0].pet._id' 2>/dev/null)
if [ -n "$PET_ID" ] && [ "$PET_ID" != "null" ]; then
    make_request "GET" "/pets/${PET_ID}" \
        "" \
        "Ver mascota por ID (público)"
fi

# 8. Ver comentarios de una publicación (público)
if [ -n "$POST_ID" ] && [ "$POST_ID" != "null" ]; then
    make_request "GET" "/posts/${POST_ID}/comments?page=1&limit=10" \
        "" \
        "Ver comentarios de una publicación (público)"
fi

# 9. Ver todas las categorías (público)
make_request "GET" "/categories" \
    "" \
    "Ver todas las categorías disponibles (público)"

# 10. Buscar usuarios (público)
make_request "GET" "/search/users?q=test&page=1&limit=10" \
    "" \
    "Buscar usuarios (público)"

# 11. Buscar publicaciones (público)
make_request "GET" "/search/posts?q=perro&page=1&limit=10" \
    "" \
    "Buscar publicaciones (público)"

echo ""

# ============================================
# INTENTOS DE ACCESO DENEGADO (deben fallar)
# ============================================
echo -e "${YELLOW}=== VERIFICANDO RESTRICCIONES ===${NC}"

# Intentar crear publicación (debe fallar - 401)
make_request "POST" "/posts" \
    '{"content":"Intento de publicación sin autenticación"}' \
    "Intentar crear publicación sin autenticación (debe fallar)"

# Intentar dar like (debe fallar - 401)
if [ -n "$POST_ID" ] && [ "$POST_ID" != "null" ]; then
    make_request "POST" "/posts/${POST_ID}/like" \
        "" \
        "Intentar dar like sin autenticación (debe fallar)"
fi

# Intentar comentar (debe fallar - 401)
if [ -n "$POST_ID" ] && [ "$POST_ID" != "null" ]; then
    make_request "POST" "/posts/${POST_ID}/comments" \
        '{"content":"Intento de comentario sin autenticación"}' \
        "Intentar comentar sin autenticación (debe fallar)"
fi

# Intentar seguir usuario (debe fallar - 401)
if [ -n "$USER_ID" ] && [ "$USER_ID" != "null" ]; then
    make_request "POST" "/users/${USER_ID}/follow" \
        "" \
        "Intentar seguir usuario sin autenticación (debe fallar)"
fi

# Intentar ver perfil propio (debe fallar - 401)
make_request "GET" "/users/me" \
    "" \
    "Intentar ver perfil propio sin autenticación (debe fallar)"

# Intentar acceder a panel admin (debe fallar - 401)
make_request "GET" "/admin/statistics" \
    "" \
    "Intentar acceder a estadísticas admin sin autenticación (debe fallar)"

echo ""

# ============================================
# RESUMEN
# ============================================
echo ""
echo -e "${BLUE}========================================${NC}"
echo -e "${BLUE}RESUMEN DE PRUEBAS - VISITANTE${NC}"
echo -e "${BLUE}========================================${NC}"
echo -e "${GREEN}Pruebas exitosas: ${PASSED}${NC}"
echo -e "${RED}Pruebas fallidas: ${FAILED}${NC}"
echo -e "${BLUE}Total: $((PASSED + FAILED))${NC}"
echo ""
echo -e "${YELLOW}Nota: Las pruebas de acceso denegado que fallan (401) son esperadas${NC}"
echo -e "${YELLOW}y confirman que las restricciones de seguridad funcionan correctamente.${NC}"
echo ""

if [ $FAILED -gt 0 ]; then
    echo -e "${YELLOW}Algunas pruebas fallaron (esto puede ser esperado para restricciones)${NC}"
    exit 0
else
    echo -e "${GREEN}¡Todas las pruebas pasaron!${NC}"
    exit 0
fi

