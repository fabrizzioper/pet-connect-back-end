#!/bin/bash

# Script para levantar MongoDB en Docker
# Uso: ./scripts/start-mongodb.sh

echo "🐳 Levantando MongoDB en contenedor Docker..."

docker-compose up -d mongodb

if [ $? -eq 0 ]; then
    echo "✅ MongoDB iniciado correctamente"
    echo "📊 Ver logs: docker-compose logs -f mongodb"
    echo "🛑 Detener: docker-compose down"
    echo ""
    echo "Esperando a que MongoDB esté listo..."
    sleep 5
    echo "✅ MongoDB listo en mongodb://admin:petconnect2024@localhost:27017/petconnect?authSource=admin"
else
    echo "❌ Error al iniciar MongoDB"
    echo "Verifica que Docker esté corriendo: docker ps"
    exit 1
fi

