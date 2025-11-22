#!/bin/bash

# PT Flow AI - Startup Script
# This script handles database setup and starts the development server

set -e  # Exit on any error

echo "🏥 PT Flow AI - Starting up..."
echo ""

# Colors for output
GREEN='\033[0;32m'
BLUE='\033[0;34m'
YELLOW='\033[1;33m'
RED='\033[0;31m'
NC='\033[0m' # No Color

# Function to check if command exists
command_exists() {
    command -v "$1" >/dev/null 2>&1
}

# Function to check if port is in use
port_in_use() {
    lsof -ti:$1 >/dev/null 2>&1
}

# Check prerequisites
echo -e "${BLUE}📋 Checking prerequisites...${NC}"

if ! command_exists docker; then
    echo -e "${RED}❌ Docker is not installed. Please install Docker Desktop.${NC}"
    exit 1
fi

if ! command_exists node; then
    echo -e "${RED}❌ Node.js is not installed. Please install Node.js 20+.${NC}"
    exit 1
fi

if ! command_exists yarn; then
    echo -e "${YELLOW}⚠️  Yarn not found. Installing yarn...${NC}"
    npm install -g yarn
fi

echo -e "${GREEN}✅ All prerequisites met${NC}"
echo ""

# Check if .env exists
if [ ! -f .env ]; then
    echo -e "${YELLOW}⚠️  .env file not found. Creating from .env.example...${NC}"
    cp .env.example .env
    echo -e "${GREEN}✅ Created .env file${NC}"
    echo -e "${YELLOW}💡 Remember to add your OPENROUTER_API_KEY to .env for AI features${NC}"
    echo ""
fi

# Install dependencies if needed
if [ ! -d "node_modules" ]; then
    echo -e "${BLUE}📦 Installing dependencies...${NC}"
    yarn install
    echo -e "${GREEN}✅ Dependencies installed${NC}"
    echo ""
fi

# Check PostgreSQL availability (local only - no Docker)
echo -e "${BLUE}🐘 Checking PostgreSQL...${NC}"

POSTGRES_RUNNING=false

# Check if PostgreSQL is accessible on port 5432
if port_in_use 5432; then
    echo -e "${BLUE}🔍 PostgreSQL detected on port 5432${NC}"
    # Try to connect to test if it's actually PostgreSQL and ptflow database exists
    if psql -h localhost -U postgres -d ptflow -c "SELECT 1" >/dev/null 2>&1; then
        echo -e "${GREEN}✅ Connected to PostgreSQL database 'ptflow'${NC}"
        POSTGRES_RUNNING=true
    elif psql -h localhost -U postgres -d postgres -c "SELECT 1" >/dev/null 2>&1; then
        # Database doesn't exist, but PostgreSQL is running - create it
        echo -e "${YELLOW}⚠️  Database 'ptflow' not found. Creating...${NC}"
        psql -h localhost -U postgres -d postgres -c "CREATE DATABASE ptflow;" >/dev/null 2>&1
        if psql -h localhost -U postgres -d ptflow -c "SELECT 1" >/dev/null 2>&1; then
            echo -e "${GREEN}✅ Database 'ptflow' created successfully${NC}"
            POSTGRES_RUNNING=true
        else
            echo -e "${RED}❌ Failed to create database 'ptflow'${NC}"
            exit 1
        fi
    else
        echo -e "${RED}❌ Port 5432 is in use but cannot connect to PostgreSQL${NC}"
        exit 1
    fi
else
    echo -e "${RED}❌ PostgreSQL is not running on port 5432${NC}"
    echo -e "${BLUE}💡 Please start PostgreSQL first:${NC}"
    echo -e "${BLUE}   - macOS (Homebrew): brew services start postgresql${NC}"
    echo -e "${BLUE}   - Linux: sudo systemctl start postgresql${NC}"
    echo -e "${BLUE}   - Or use Docker: docker-compose up -d${NC}"
    exit 1
fi

if [ "$POSTGRES_RUNNING" = false ]; then
    echo -e "${RED}❌ Could not connect to PostgreSQL${NC}"
    echo -e "${BLUE}💡 Please ensure PostgreSQL is running on localhost:5432${NC}"
    exit 1
fi

echo ""

# Check if Prisma client is generated
if [ ! -d "node_modules/@prisma/client" ] && [ ! -d "node_modules/.prisma" ]; then
    echo -e "${BLUE}🔧 Generating Prisma client...${NC}"
    npx prisma generate
    echo -e "${GREEN}✅ Prisma client generated${NC}"
    echo ""
fi

# Check if database exists and has tables
echo -e "${BLUE}🗄️  Checking database...${NC}"

DB_EXISTS=$(psql -h localhost -U postgres -d ptflow -c "SELECT COUNT(*) FROM information_schema.tables WHERE table_schema = 'public';" 2>/dev/null | grep -oE '[0-9]+' | head -1 || echo "0")

if [ "$DB_EXISTS" = "0" ] || [ -z "$DB_EXISTS" ]; then
    echo -e "${YELLOW}⚠️  Database schema not found. Pushing schema...${NC}"
    npx prisma db push --accept-data-loss
    echo -e "${GREEN}✅ Database schema created${NC}"
    echo ""

    # Check if database is empty (no users)
    USER_COUNT=$(psql -h localhost -U postgres -d ptflow -c "SELECT COUNT(*) FROM users;" 2>/dev/null | grep -oE '[0-9]+' | head -1 || echo "0")

    if [ "$USER_COUNT" = "0" ] || [ -z "$USER_COUNT" ]; then
        echo -e "${BLUE}🌱 Seeding database with demo data...${NC}"
        yarn db:seed
        echo -e "${GREEN}✅ Database seeded${NC}"
        echo ""
    else
        echo -e "${GREEN}✅ Database already has data${NC}"
        echo ""
    fi
else
    echo -e "${GREEN}✅ Database schema exists${NC}"
    echo ""
fi

# Clean Next.js cache
echo -e "${BLUE}🧹 Cleaning Next.js cache...${NC}"
rm -rf .next
echo -e "${GREEN}✅ Next.js cache cleared${NC}"
echo ""

# Check and clean port 3000 automatically
if port_in_use 3000; then
    echo -e "${YELLOW}⚠️  Port 3000 is in use. Cleaning up...${NC}"
    PROCESS_INFO=$(lsof -ti:3000 | head -1)
    if [ ! -z "$PROCESS_INFO" ]; then
        PROCESS_NAME=$(ps -p $PROCESS_INFO -o comm= 2>/dev/null || echo "unknown")
        echo -e "${BLUE}   Killing process: $PROCESS_NAME (PID: $PROCESS_INFO)${NC}"
    fi
    lsof -ti:3000 | xargs kill -9 2>/dev/null || true
    sleep 1
    echo -e "${GREEN}✅ Port 3000 is now free${NC}"
    echo ""
fi

# Display startup information
echo -e "${GREEN}━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━${NC}"
echo -e "${GREEN}🎉 PT Flow AI is ready!${NC}"
echo -e "${GREEN}━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━${NC}"
echo ""
echo -e "${BLUE}📍 Application:${NC}     http://localhost:3000"
echo -e "${BLUE}🗄️  Database:${NC}        PostgreSQL (localhost:5432)"
echo ""
echo -e "${YELLOW}🔐 Demo Login Credentials:${NC}"
echo -e "   Email:    ${GREEN}admin@ptflow.ai${NC}"
echo -e "   Password: ${GREEN}password123${NC}"
echo ""
echo -e "   Or try:   ${GREEN}therapist1@ptflow.ai${NC}"
echo -e "   Password: ${GREEN}password123${NC}"
echo ""
echo -e "${BLUE}💡 Useful Commands:${NC}"
echo -e "   ${YELLOW}yarn db:studio${NC}  - Open database GUI"
echo -e "   ${YELLOW}Ctrl+C${NC}          - Stop the server"
echo ""
echo -e "${GREEN}━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━${NC}"
echo ""

# Start the development server
echo -e "${BLUE}🚀 Starting development server...${NC}"
echo ""

yarn dev
