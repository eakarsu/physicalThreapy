#!/bin/bash

# PT Flow AI - Reset Script
# This script completely resets the database and re-seeds it

set -e

# Colors
GREEN='\033[0;32m'
BLUE='\033[0;34m'
YELLOW='\033[1;33m'
RED='\033[0;31m'
NC='\033[0m'

echo -e "${RED}⚠️  WARNING: This will delete ALL data in the database!${NC}"
echo ""
read -p "Are you sure you want to continue? (yes/no) " -r
echo ""

if [[ ! $REPLY =~ ^[Yy][Ee][Ss]$ ]]; then
    echo "Cancelled."
    exit 0
fi

echo -e "${BLUE}🔄 Resetting PT Flow AI database...${NC}"
echo ""

# Make sure PostgreSQL is running
if ! docker-compose ps | grep -q "ptflow-postgres.*Up"; then
    echo -e "${BLUE}🐘 Starting PostgreSQL...${NC}"
    docker-compose up -d
    sleep 5
fi

# Reset database
echo -e "${BLUE}🗄️  Dropping and recreating database...${NC}"
npx prisma db push --force-reset --accept-data-loss

echo -e "${GREEN}✅ Database reset${NC}"
echo ""

# Seed database
echo -e "${BLUE}🌱 Seeding database with fresh demo data...${NC}"
yarn db:seed

echo ""
echo -e "${GREEN}━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━${NC}"
echo -e "${GREEN}✅ Database reset complete!${NC}"
echo -e "${GREEN}━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━${NC}"
echo ""
echo -e "${BLUE}🔐 Demo Login Credentials:${NC}"
echo -e "   Email:    ${GREEN}admin@ptflow.ai${NC}"
echo -e "   Password: ${GREEN}password123${NC}"
echo ""
echo -e "${BLUE}💡 Start the app: ${YELLOW}./start.sh${NC}"
echo ""
