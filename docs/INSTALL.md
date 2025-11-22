# PT Flow AI - Installation Guide

This guide covers everything you need to get PT Flow AI running on your machine.

## Table of Contents

- [System Requirements](#system-requirements)
- [Quick Installation (5 minutes)](#quick-installation-5-minutes)
- [Detailed Installation](#detailed-installation)
- [Troubleshooting](#troubleshooting)
- [Next Steps](#next-steps)

---

## System Requirements

### Required

- **macOS**, **Linux**, or **Windows** (with WSL2)
- **Node.js 20.x or higher** - [Download](https://nodejs.org/)
- **Docker Desktop** - [Download](https://www.docker.com/products/docker-desktop/)
- **8GB RAM minimum** (16GB recommended)
- **2GB free disk space**

### Optional

- **Yarn** (will be installed automatically if missing)
- **Git** (for version control)
- **OpenRouter API key** (for AI features) - [Sign up](https://openrouter.ai/)

---

## Quick Installation (5 minutes)

### Step 1: Verify Prerequisites

Open your terminal and verify you have the required software:

```bash
# Check Node.js version (should be 20+)
node --version

# Check Docker
docker --version

# Check Docker is running
docker ps
```

If any command fails, install the missing software from the links above.

### Step 2: Navigate to Project

```bash
cd physicalThreapy
```

### Step 3: Run Start Script

```bash
./start.sh
```

That's it! The script will:
- ✅ Check all prerequisites
- ✅ Install dependencies
- ✅ Start PostgreSQL in Docker
- ✅ Set up the database
- ✅ Seed with demo data
- ✅ Start the development server

### Step 4: Access the Application

Open your browser to:
```
http://localhost:3000
```

**Login with:**
- Email: `admin@ptflow.ai`
- Password: `password123`

---

## Detailed Installation

If you prefer to understand each step or if the quick installation didn't work, follow this guide.

### 1. Install Node.js

#### macOS (using Homebrew)
```bash
brew install node@20
```

#### macOS/Linux (using nvm - recommended)
```bash
# Install nvm
curl -o- https://raw.githubusercontent.com/nvm-sh/nvm/v0.39.0/install.sh | bash

# Restart terminal, then:
nvm install 20
nvm use 20
```

#### Windows
Download and install from [nodejs.org](https://nodejs.org/)

**Verify:**
```bash
node --version  # Should show v20.x.x or higher
npm --version   # Should show 10.x.x or higher
```

### 2. Install Docker Desktop

#### macOS
Download from [docker.com/products/docker-desktop](https://www.docker.com/products/docker-desktop/)

#### Linux (Ubuntu/Debian)
```bash
# Install Docker
curl -fsSL https://get.docker.com -o get-docker.sh
sudo sh get-docker.sh

# Install Docker Compose
sudo apt-get install docker-compose-plugin

# Add user to docker group
sudo usermod -aG docker $USER

# Log out and back in for changes to take effect
```

#### Windows
Download from [docker.com/products/docker-desktop](https://www.docker.com/products/docker-desktop/)

Make sure to enable WSL2 backend during installation.

**Verify:**
```bash
docker --version
docker-compose --version
docker ps  # Should not show errors
```

### 3. Install Yarn (Optional)

The start script will install Yarn if it's missing, but you can install it manually:

```bash
npm install -g yarn
```

**Verify:**
```bash
yarn --version
```

### 4. Clone or Navigate to Project

If you haven't already:

```bash
cd physicalThreapy
```

### 5. Run the Installation

#### Option A: Automated (Recommended)

```bash
./start.sh
```

The script handles everything automatically.

#### Option B: Manual Step-by-Step

If you prefer manual control:

```bash
# 1. Install dependencies
yarn install

# 2. Create .env file
cp .env.example .env

# 3. Start PostgreSQL
docker-compose up -d

# 4. Wait for PostgreSQL to be ready (about 10 seconds)
sleep 10

# 5. Generate Prisma client
npx prisma generate

# 6. Push database schema
npx prisma db push

# 7. Seed database
yarn db:seed

# 8. Start development server
yarn dev
```

### 6. Access the Application

Open your browser to:
```
http://localhost:3000
```

You should see the login page.

### 7. Login

Use one of these credentials:

| Role | Email | Password |
|------|-------|----------|
| Admin | admin@ptflow.ai | password123 |
| Therapist | therapist1@ptflow.ai | password123 |
| Therapist | therapist2@ptflow.ai | password123 |
| Therapist | therapist3@ptflow.ai | password123 |
| Staff | frontdesk1@ptflow.ai | password123 |

---

## Troubleshooting

### "Docker is not running"

**Problem:** Docker Desktop is not started.

**Solution:**
1. Open Docker Desktop application
2. Wait for it to fully start (whale icon in taskbar should be stable)
3. Run `docker ps` to verify
4. Try `./start.sh` again

---

### "Port 5432 already in use"

**Problem:** Another PostgreSQL instance is using port 5432.

**Solution 1 - Stop the other PostgreSQL:**
```bash
# macOS (if installed via Homebrew)
brew services stop postgresql

# Linux
sudo systemctl stop postgresql

# Then restart start.sh
./start.sh
```

**Solution 2 - Use a different port:**

Edit `docker-compose.yml`:
```yaml
ports:
  - '5433:5432'  # Use 5433 instead
```

Edit `.env`:
```env
DATABASE_URL="postgresql://postgres:postgres@localhost:5433/ptflow"
```

Then run `./start.sh`

---

### "Port 3000 already in use"

**Problem:** Another application is using port 3000.

**Solution 1 - Use the start script:**
The `start.sh` script will offer to kill the process for you.

**Solution 2 - Manual:**
```bash
# Find and kill the process
lsof -ti:3000 | xargs kill -9

# Or use a different port
yarn dev -p 3001
```

If using a different port, update `.env`:
```env
NEXTAUTH_URL="http://localhost:3001"
```

---

### "Cannot find module '@prisma/client'"

**Problem:** Prisma client is not generated.

**Solution:**
```bash
npx prisma generate
```

Then restart the dev server.

---

### "Connection refused" or "Database connection error"

**Problem:** PostgreSQL is not running or not ready.

**Solution:**
```bash
# Check if PostgreSQL container is running
docker-compose ps

# If not running, start it
docker-compose up -d

# Check logs
docker-compose logs postgres

# Wait for "database system is ready to accept connections"
# Then restart start.sh
```

---

### "yarn: command not found"

**Problem:** Yarn is not installed.

**Solution:**
```bash
npm install -g yarn
```

Or let the `start.sh` script install it automatically.

---

### Database is empty / No login works

**Problem:** Database wasn't seeded.

**Solution:**
```bash
yarn db:seed
```

Or reset everything:
```bash
./reset.sh
```

---

### "Error: P1001: Can't reach database server"

**Problem:** Database connection settings are incorrect.

**Solution:**

1. Check `.env` file:
```env
DATABASE_URL="postgresql://postgres:postgres@localhost:5432/ptflow"
```

2. Verify PostgreSQL is running:
```bash
docker-compose ps
```

3. Test connection manually:
```bash
docker-compose exec postgres psql -U postgres -d ptflow
```

If this works, the issue is with Prisma. Try:
```bash
npx prisma generate
npx prisma db push
```

---

### AI Features Not Working

**Problem:** OpenRouter API key is missing or invalid.

**Solution:**

1. Sign up at https://openrouter.ai/
2. Create an API key
3. Add to `.env`:
```env
OPENROUTER_API_KEY="sk-or-v1-your-actual-key-here"
```

4. Restart the dev server (Ctrl+C, then `yarn dev`)

**Note:** The app works without AI features; they're optional.

---

### On Windows: Script execution errors

**Problem:** Bash scripts don't work on Windows PowerShell.

**Solution:**

Use WSL2 (Windows Subsystem for Linux):

1. Install WSL2: [Microsoft docs](https://learn.microsoft.com/en-us/windows/wsl/install)
2. Open WSL2 terminal
3. Navigate to project directory
4. Run `./start.sh`

Or use manual commands (see Option B above).

---

### "Module not found" errors

**Problem:** Dependencies are not installed or outdated.

**Solution:**
```bash
# Delete node_modules and reinstall
rm -rf node_modules
yarn install

# Generate Prisma client
npx prisma generate
```

---

### Docker on Linux: Permission denied

**Problem:** User doesn't have Docker permissions.

**Solution:**
```bash
# Add user to docker group
sudo usermod -aG docker $USER

# Log out and back in, then verify
docker ps
```

---

## Verification Checklist

After installation, verify everything works:

- [ ] PostgreSQL is running: `docker-compose ps`
- [ ] Database has tables: `yarn db:studio` (opens GUI)
- [ ] Dev server starts: `yarn dev`
- [ ] Can access app: http://localhost:3000
- [ ] Can login with demo credentials
- [ ] Dashboard shows data (patient count, appointments, etc.)

If all boxes are checked, you're ready to develop!

---

## Next Steps

### 1. Explore the Application

- Login with different user roles
- Check the dashboard
- Open Prisma Studio to see the data: `yarn db:studio`

### 2. Review the Documentation

- `README.md` - Complete project overview
- `GETTING_STARTED.md` - Feature overview and development guide
- `PROJECT_SUMMARY.md` - Technical architecture
- `QUICK_REFERENCE.md` - Command cheat sheet

### 3. Set Up for Development

If you plan to develop:

1. **Enable AI features:**
   - Get OpenRouter API key
   - Add to `.env`
   - Restart server

2. **Set up your editor:**
   - VS Code recommended
   - Install ESLint extension
   - Install Prisma extension

3. **Read the code:**
   - Start with `app/dashboard/page.tsx`
   - Review `prisma/schema.prisma`
   - Check `lib/ai.ts` for AI integration

### 4. Start Building

The foundation is complete. You can now build:
- Patient management pages
- Appointment calendar
- Session note forms
- Progress charts
- And more!

All data models are ready in the database with sample data.

---

## Getting Help

### Documentation
- This guide (INSTALL.md)
- README.md for overview
- GETTING_STARTED.md for usage
- QUICK_REFERENCE.md for commands

### Common Issues
- Check the [Troubleshooting](#troubleshooting) section above
- Review error messages in terminal
- Check browser console (F12)

### Still Stuck?

1. Check all prerequisites are met
2. Try the manual installation (Option B)
3. Reset everything: `./reset.sh`
4. Review Docker logs: `docker-compose logs`

---

## Uninstallation

To completely remove PT Flow AI:

```bash
# Stop all services
./stop.sh

# Remove Docker containers and volumes
docker-compose down -v

# Remove node_modules (optional)
rm -rf node_modules

# The database data is gone, but project files remain
```

To reinstall, just run `./start.sh` again.

---

**You're all set! Enjoy building with PT Flow AI!** 🎉
