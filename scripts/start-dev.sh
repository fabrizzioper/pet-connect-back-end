#!/bin/bash

# Script para iniciar el entorno de desarrollo completo
# Levanta MongoDB y luego el servidor NestJS

echo "🚀 Iniciando entorno de desarrollo de PetConnect..."

# Colores
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
RED='\033[0;31m'
NC='\033[0m'

# Verificar si Docker está corriendo
if ! docker info > /dev/null 2>&1; then
    echo -e "${RED}❌ Docker no está corriendo. Por favor inicia Docker Desktop.${NC}"
    exit 1
fi

# Verificar si MongoDB ya está corriendo
if docker ps | grep -q petconnect-mongodb; then
    echo -e "${GREEN}✅ MongoDB ya está corriendo${NC}"
else
    echo -e "${BLUE}🐳 Levantando MongoDB en Docker...${NC}"
    docker-compose up -d mongodb
    
    if [ $? -ne 0 ]; then
        echo -e "${RED}❌ Error al levantar MongoDB${NC}"
        exit 1
    fi
    
    echo -e "${YELLOW}⏳ Esperando a que MongoDB esté listo...${NC}"
    sleep 5
    
    # Verificar que MongoDB esté respondiendo
    max_attempts=30
    attempt=0
    while [ $attempt -lt $max_attempts ]; do
        if docker exec petconnect-mongodb mongosh --eval "db.adminCommand('ping')" --quiet > /dev/null 2>&1; then
            echo -e "${GREEN}✅ MongoDB está listo${NC}"
            break
        fi
        attempt=$((attempt + 1))
        sleep 1
    done
    
    if [ $attempt -eq $max_attempts ]; then
        echo -e "${RED}❌ MongoDB no respondió después de ${max_attempts} intentos${NC}"
        exit 1
    fi
fi

echo -e "${BLUE}📦 Iniciando servidor NestJS...${NC}"
echo ""

# Iniciar el servidor NestJS directamente
nest start --watch

