#!/bin/bash

# Script para probar todos los endpoints de PetConnect Backend
# Uso: ./scripts/test-endpoints.sh [BASE_URL]
# Ejemplo: ./scripts/test-endpoints.sh http://localhost:3000

BASE_URL="${1:-http://localhost:3000}"
API_URL="${BASE_URL}/api"

# Colores para output
GREEN='\033[0;32m'
RED='\033[0;31m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

# Variables para almacenar datos
TOKEN=""
USER_ID=""
PET_ID=""
POST_ID=""
COMMENT_ID=""
CATEGORY_ID=""
USER2_ID=""

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

# Verificar que curl y jq estén instalados
if ! command -v curl &> /dev/null; then
    echo -e "${RED}Error: curl no está instalado${NC}"
    exit 1
fi

if ! command -v jq &> /dev/null; then
    echo -e "${YELLOW}Advertencia: jq no está instalado. Las respuestas JSON no se formatearán.${NC}"
fi

echo -e "${BLUE}========================================${NC}"
echo -e "${BLUE}PetConnect Backend - Test de Endpoints${NC}"
echo -e "${BLUE}========================================${NC}"
echo -e "Base URL: ${BASE_URL}"
echo ""

# ============================================
# 1. AUTENTICACIÓN
# ============================================
echo -e "${YELLOW}=== AUTENTICACIÓN ===${NC}"

# 1.1 Registro
make_request "POST" "/auth/register" \
    '{"username":"testuser","email":"test@example.com","password":"Test1234","fullName":"Test User"}' \
    "" \
    "Registro de usuario"

# Extraer token del registro
TOKEN=$(echo "$body" | jq -r '.token' 2>/dev/null)
USER_ID=$(echo "$body" | jq -r '.user._id' 2>/dev/null)

if [ -z "$TOKEN" ] || [ "$TOKEN" = "null" ]; then
    echo -e "${RED}Error: No se pudo obtener el token. Intentando login...${NC}"
    make_request "POST" "/auth/login" \
        '{"email":"test@example.com","password":"Test1234"}' \
        "" \
        "Login de usuario"
    TOKEN=$(echo "$body" | jq -r '.token' 2>/dev/null)
    USER_ID=$(echo "$body" | jq -r '.user._id' 2>/dev/null)
fi

# 1.2 Login (con usuario diferente)
make_request "POST" "/auth/login" \
    '{"email":"test@example.com","password":"Test1234"}' \
    "" \
    "Login de usuario existente"

# 1.3 Verificar Token
make_request "GET" "/auth/verify" \
    "" \
    "$TOKEN" \
    "Verificar token JWT"

echo ""

# ============================================
# 2. USUARIOS
# ============================================
echo -e "${YELLOW}=== USUARIOS ===${NC}"

# 2.1 Obtener perfil actual
make_request "GET" "/users/me" \
    "" \
    "$TOKEN" \
    "Obtener perfil del usuario actual"

# 2.2 Obtener perfil de otro usuario
make_request "GET" "/users/${USER_ID}" \
    "" \
    "" \
    "Obtener perfil de otro usuario (público)"

# 2.3 Actualizar perfil
make_request "PUT" "/users/me" \
    '{"fullName":"Test User Updated","bio":"Bio de prueba"}' \
    "$TOKEN" \
    "Actualizar perfil"

# 2.4 Cambiar contraseña
make_request "PUT" "/users/me/password" \
    '{"currentPassword":"Test1234","newPassword":"NewTest1234"}' \
    "$TOKEN" \
    "Cambiar contraseña"

# Cambiar de vuelta la contraseña
make_request "PUT" "/users/me/password" \
    '{"currentPassword":"NewTest1234","newPassword":"Test1234"}' \
    "$TOKEN" \
    "Restaurar contraseña original"

echo ""

# ============================================
# 3. MASCOTAS
# ============================================
echo -e "${YELLOW}=== MASCOTAS ===${NC}"

# 3.1 Crear mascota
make_request "POST" "/pets" \
    '{"name":"Max","type":"dog","breed":"Golden Retriever","age":3,"description":"Perro muy juguetón"}' \
    "$TOKEN" \
    "Crear mascota"

PET_ID=$(echo "$body" | jq -r '.pet._id' 2>/dev/null)

# 3.2 Obtener mis mascotas
make_request "GET" "/pets/my-pets" \
    "" \
    "$TOKEN" \
    "Obtener mascotas del usuario"

# 3.3 Obtener mascota por ID
if [ -n "$PET_ID" ] && [ "$PET_ID" != "null" ]; then
    make_request "GET" "/pets/${PET_ID}" \
        "" \
        "" \
        "Obtener mascota por ID (público)"
    
    # 3.4 Actualizar mascota
    make_request "PUT" "/pets/${PET_ID}" \
        '{"name":"Max Updated","age":4}' \
        "$TOKEN" \
        "Actualizar mascota"
fi

echo ""

# ============================================
# 4. PUBLICACIONES
# ============================================
echo -e "${YELLOW}=== PUBLICACIONES ===${NC}"

# 4.1 Crear publicación
make_request "POST" "/posts" \
    "{\"content\":\"¡Mi perro aprendió un nuevo truco!\",\"petId\":\"${PET_ID}\",\"category\":\"dog\"}" \
    "$TOKEN" \
    "Crear publicación"

POST_ID=$(echo "$body" | jq -r '.post._id' 2>/dev/null)

# 4.2 Obtener feed principal
make_request "GET" "/posts/feed?page=1&limit=10" \
    "" \
    "" \
    "Obtener feed principal (público)"

# 4.3 Obtener feed personalizado
make_request "GET" "/posts/feed/following?page=1&limit=10" \
    "" \
    "$TOKEN" \
    "Obtener feed de usuarios seguidos"

# 4.4 Obtener publicación por ID
if [ -n "$POST_ID" ] && [ "$POST_ID" != "null" ]; then
    make_request "GET" "/posts/${POST_ID}" \
        "" \
        "" \
        "Obtener publicación por ID (público)"
    
    # 4.5 Obtener publicaciones de un usuario
    make_request "GET" "/posts/user/${USER_ID}?page=1&limit=10" \
        "" \
        "" \
        "Obtener publicaciones de un usuario"
    
    # 4.6 Actualizar publicación
    make_request "PUT" "/posts/${POST_ID}" \
        '{"content":"Contenido actualizado"}' \
        "$TOKEN" \
        "Actualizar publicación"
    
    # 4.7 Dar like
    make_request "POST" "/posts/${POST_ID}/like" \
        "" \
        "$TOKEN" \
        "Dar like a publicación"
    
    # 4.8 Reportar publicación
    make_request "POST" "/posts/${POST_ID}/report" \
        '{"reason":"Contenido inapropiado"}' \
        "$TOKEN" \
        "Reportar publicación"
fi

echo ""

# ============================================
# 5. COMENTARIOS
# ============================================
echo -e "${YELLOW}=== COMENTARIOS ===${NC}"

if [ -n "$POST_ID" ] && [ "$POST_ID" != "null" ]; then
    # 5.1 Crear comentario
    make_request "POST" "/posts/${POST_ID}/comments" \
        '{"content":"¡Qué lindo perro!"}' \
        "$TOKEN" \
        "Crear comentario"
    
    COMMENT_ID=$(echo "$body" | jq -r '.comment._id' 2>/dev/null)
    
    # 5.2 Obtener comentarios
    make_request "GET" "/posts/${POST_ID}/comments?page=1&limit=10" \
        "" \
        "" \
        "Obtener comentarios de una publicación"
    
    if [ -n "$COMMENT_ID" ] && [ "$COMMENT_ID" != "null" ]; then
        # 5.3 Actualizar comentario
        make_request "PUT" "/comments/${COMMENT_ID}" \
            '{"content":"Comentario actualizado"}' \
            "$TOKEN" \
            "Actualizar comentario"
        
        # 5.4 Dar like a comentario
        make_request "POST" "/comments/${COMMENT_ID}/like" \
            "" \
            "$TOKEN" \
            "Dar like a comentario"
        
        # 5.5 Reportar comentario
        make_request "POST" "/comments/${COMMENT_ID}/report" \
            '{"reason":"Comentario ofensivo"}' \
            "$TOKEN" \
            "Reportar comentario"
    fi
fi

echo ""

# ============================================
# 6. RELACIONES SOCIALES
# ============================================
echo -e "${YELLOW}=== RELACIONES SOCIALES ===${NC}"

# Crear segundo usuario para seguir
make_request "POST" "/auth/register" \
    '{"username":"testuser2","email":"test2@example.com","password":"Test1234","fullName":"Test User 2"}' \
    "" \
    "Registro de segundo usuario"

TOKEN2=$(echo "$body" | jq -r '.token' 2>/dev/null)
USER2_ID=$(echo "$body" | jq -r '.user._id' 2>/dev/null)

if [ -n "$USER2_ID" ] && [ "$USER2_ID" != "null" ]; then
    # 6.1 Seguir usuario
    make_request "POST" "/users/${USER2_ID}/follow" \
        "" \
        "$TOKEN" \
        "Seguir usuario"
    
    # 6.2 Obtener seguidores
    make_request "GET" "/users/${USER2_ID}/followers?page=1&limit=10" \
        "" \
        "" \
        "Obtener seguidores de un usuario"
    
    # 6.3 Obtener usuarios seguidos
    make_request "GET" "/users/${USER_ID}/following?page=1&limit=10" \
        "" \
        "" \
        "Obtener usuarios seguidos"
    
    # 6.4 Dejar de seguir
    make_request "DELETE" "/users/${USER2_ID}/follow" \
        "" \
        "$TOKEN" \
        "Dejar de seguir usuario"
fi

echo ""

# ============================================
# 7. CATEGORÍAS
# ============================================
echo -e "${YELLOW}=== CATEGORÍAS ===${NC}"

# 7.1 Obtener todas las categorías
make_request "GET" "/categories" \
    "" \
    "" \
    "Obtener todas las categorías (público)"

# Nota: Las operaciones de admin requieren token de admin
# Se pueden probar manualmente con un usuario admin

echo ""

# ============================================
# 8. BÚSQUEDA
# ============================================
echo -e "${YELLOW}=== BÚSQUEDA ===${NC}"

# 8.1 Buscar usuarios
make_request "GET" "/search/users?q=test&page=1&limit=10" \
    "" \
    "" \
    "Buscar usuarios"

# 8.2 Buscar publicaciones
make_request "GET" "/search/posts?q=perro&page=1&limit=10" \
    "" \
    "" \
    "Buscar publicaciones"

echo ""

# ============================================
# 9. ADMINISTRACIÓN
# ============================================
echo -e "${YELLOW}=== ADMINISTRACIÓN ===${NC}"
echo -e "${YELLOW}Nota: Estos endpoints requieren rol ADMIN${NC}"
echo -e "${YELLOW}Se pueden probar manualmente con un usuario admin${NC}"

# ============================================
# RESUMEN
# ============================================
echo ""
echo -e "${BLUE}========================================${NC}"
echo -e "${BLUE}RESUMEN DE PRUEBAS${NC}"
echo -e "${BLUE}========================================${NC}"
echo -e "${GREEN}Pruebas exitosas: ${PASSED}${NC}"
echo -e "${RED}Pruebas fallidas: ${FAILED}${NC}"
echo -e "${BLUE}Total: $((PASSED + FAILED))${NC}"
echo ""

if [ $FAILED -eq 0 ]; then
    echo -e "${GREEN}¡Todas las pruebas pasaron!${NC}"
    exit 0
else
    echo -e "${RED}Algunas pruebas fallaron${NC}"
    exit 1
fi



