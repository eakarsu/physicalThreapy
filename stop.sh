#!/bin/bash

# PT Flow AI - Stop Script
# This script stops all running services

echo "🛑 Stopping PT Flow AI..."
echo ""

# Colors
GREEN='\033[0;32m'
BLUE='\033[0;34m'
YELLOW='\033[1;33m'
NC='\033[0m'

# Stop Next.js dev server (if running on port 3000)
if lsof -ti:3000 >/dev/null 2>&1; then
    echo -e "${BLUE}🔌 Stopping Next.js development server...${NC}"
    lsof -ti:3000 | xargs kill -9 2>/dev/null
    echo -e "${GREEN}✅ Development server stopped${NC}"
else
    echo -e "${YELLOW}ℹ️  Development server not running${NC}"
fi

# Stop PostgreSQL
if docker-compose ps | grep -q "ptflow-postgres"; then
    echo -e "${BLUE}🐘 Stopping PostgreSQL...${NC}"
    docker-compose stop
    echo -e "${GREEN}✅ PostgreSQL stopped${NC}"
else
    echo -e "${YELLOW}ℹ️  PostgreSQL not running${NC}"
fi

echo ""
echo -e "${GREEN}✅ All services stopped${NC}"
echo ""
echo -e "${BLUE}💡 To start again, run: ${YELLOW}./start.sh${NC}"
echo ""
