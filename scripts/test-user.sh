#!/bin/bash

# Script para probar endpoints como USUARIO REGISTRADO
# Puede crear y modificar su contenido, interactuar con otros usuarios

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
USER2_ID=""
TOKEN2=""

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
echo -e "${BLUE}PetConnect - Pruebas como USUARIO${NC}"
echo -e "${BLUE}========================================${NC}"
echo -e "Base URL: ${BASE_URL}"
echo ""

# ============================================
# 1. AUTENTICACIÓN
# ============================================
echo -e "${YELLOW}=== AUTENTICACIÓN ===${NC}"

# 1.1 Registro de usuario
make_request "POST" "/auth/register" \
    '{"username":"user_test","email":"user@test.com","password":"User1234","fullName":"Usuario Test"}' \
    "" \
    "Registro de usuario"

TOKEN=$(echo "$body" | jq -r '.token' 2>/dev/null)
USER_ID=$(echo "$body" | jq -r '.user._id' 2>/dev/null)

if [ -z "$TOKEN" ] || [ "$TOKEN" = "null" ]; then
    echo -e "${RED}Error: No se pudo obtener el token. Intentando login...${NC}"
    make_request "POST" "/auth/login" \
        '{"email":"user@test.com","password":"User1234"}' \
        "" \
        "Login de usuario"
    TOKEN=$(echo "$body" | jq -r '.token' 2>/dev/null)
    USER_ID=$(echo "$body" | jq -r '.user._id' 2>/dev/null)
fi

# 1.2 Verificar token
make_request "GET" "/auth/verify" \
    "" \
    "$TOKEN" \
    "Verificar token JWT"

echo ""

# ============================================
# 2. GESTIÓN DE PERFIL
# ============================================
echo -e "${YELLOW}=== GESTIÓN DE PERFIL ===${NC}"

# 2.1 Obtener perfil actual
make_request "GET" "/users/me" \
    "" \
    "$TOKEN" \
    "Obtener perfil del usuario actual"

# 2.2 Actualizar perfil
make_request "PUT" "/users/me" \
    '{"fullName":"Usuario Test Actualizado","bio":"Bio de prueba de usuario"}' \
    "$TOKEN" \
    "Actualizar perfil"

# 2.3 Cambiar contraseña
make_request "PUT" "/users/me/password" \
    '{"currentPassword":"User1234","newPassword":"NewUser1234"}' \
    "$TOKEN" \
    "Cambiar contraseña"

# Restaurar contraseña original
make_request "PUT" "/users/me/password" \
    '{"currentPassword":"NewUser1234","newPassword":"User1234"}' \
    "$TOKEN" \
    "Restaurar contraseña original"

echo ""

# ============================================
# 3. GESTIÓN DE MASCOTAS
# ============================================
echo -e "${YELLOW}=== GESTIÓN DE MASCOTAS ===${NC}"

# 3.1 Crear mascota
make_request "POST" "/pets" \
    '{"name":"Luna","type":"cat","breed":"Persa","age":2,"description":"Gato muy cariñoso"}' \
    "$TOKEN" \
    "Crear mascota"

PET_ID=$(echo "$body" | jq -r '.pet._id' 2>/dev/null)

# 3.2 Obtener mis mascotas
make_request "GET" "/pets/my-pets" \
    "" \
    "$TOKEN" \
    "Obtener mascotas del usuario"

# 3.3 Actualizar mascota
if [ -n "$PET_ID" ] && [ "$PET_ID" != "null" ]; then
    make_request "PUT" "/pets/${PET_ID}" \
        '{"name":"Luna Updated","age":3}' \
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
    "{\"content\":\"¡Mi gato aprendió un nuevo truco!\",\"petId\":\"${PET_ID}\",\"category\":\"cat\"}" \
    "$TOKEN" \
    "Crear publicación"

POST_ID=$(echo "$body" | jq -r '.post._id' 2>/dev/null)

# 4.2 Obtener feed principal
make_request "GET" "/posts/feed?page=1&limit=10" \
    "" \
    "$TOKEN" \
    "Obtener feed principal"

# 4.3 Obtener feed personalizado
make_request "GET" "/posts/feed/following?page=1&limit=10" \
    "" \
    "$TOKEN" \
    "Obtener feed de usuarios seguidos"

# 4.4 Actualizar publicación
if [ -n "$POST_ID" ] && [ "$POST_ID" != "null" ]; then
    make_request "PUT" "/posts/${POST_ID}" \
        '{"content":"Contenido actualizado por el usuario"}' \
        "$TOKEN" \
        "Actualizar publicación"
    
    # 4.5 Dar like
    make_request "POST" "/posts/${POST_ID}/like" \
        "" \
        "$TOKEN" \
        "Dar like a publicación"
    
    # 4.6 Reportar publicación (de otro usuario)
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
        '{"content":"¡Qué lindo gato!"}' \
        "$TOKEN" \
        "Crear comentario"
    
    COMMENT_ID=$(echo "$body" | jq -r '.comment._id' 2>/dev/null)
    
    # 5.2 Obtener comentarios
    make_request "GET" "/posts/${POST_ID}/comments?page=1&limit=10" \
        "" \
        "$TOKEN" \
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
    fi
fi

echo ""

# ============================================
# 6. RELACIONES SOCIALES
# ============================================
echo -e "${YELLOW}=== RELACIONES SOCIALES ===${NC}"

# Crear segundo usuario para seguir
make_request "POST" "/auth/register" \
    '{"username":"user2_test","email":"user2@test.com","password":"User1234","fullName":"Usuario 2 Test"}' \
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
# 7. BÚSQUEDA
# ============================================
echo -e "${YELLOW}=== BÚSQUEDA ===${NC}"

# 7.1 Buscar usuarios
make_request "GET" "/search/users?q=user&page=1&limit=10" \
    "" \
    "" \
    "Buscar usuarios"

# 7.2 Buscar publicaciones
make_request "GET" "/search/posts?q=gato&page=1&limit=10" \
    "" \
    "" \
    "Buscar publicaciones"

echo ""

# ============================================
# 8. VERIFICAR RESTRICCIONES (deben fallar)
# ============================================
echo -e "${YELLOW}=== VERIFICANDO RESTRICCIONES ===${NC}"

# Intentar acceder a panel admin (debe fallar - 403)
make_request "GET" "/admin/statistics" \
    "" \
    "$TOKEN" \
    "Intentar acceder a estadísticas admin (debe fallar - 403)"

# Intentar eliminar publicación de otro usuario (debe fallar - 403)
# Esto se probaría con una publicación de otro usuario

echo ""

# ============================================
# RESUMEN
# ============================================
echo ""
echo -e "${BLUE}========================================${NC}"
echo -e "${BLUE}RESUMEN DE PRUEBAS - USUARIO${NC}"
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



