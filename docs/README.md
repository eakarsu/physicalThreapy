# PT Flow AI

A comprehensive Physical Therapy practice management system with integrated AI capabilities, built with Next.js, PostgreSQL, Prisma, and Material UI.

## Features

- **Patient Management**: Complete patient records with medical history, diagnoses, and demographics
- **Appointment Scheduling**: Calendar-based scheduling system with therapist assignments
- **Session Documentation**: SOAP note documentation with exercise tracking
- **Progress Tracking**: Visual charts showing patient improvement over time
- **Billing & Claims**: Insurance management and claims processing
- **Secure Messaging**: HIPAA-compliant messaging between staff and patients
- **AI-Powered Features**:
  - Session note summarization (clinical & patient-friendly)
  - Personalized home exercise plan generation
  - Progress summary reports
  - Insurance claim justification generation
- **Role-Based Access Control**: Admin, Therapist, Staff, and Patient Portal roles

## Tech Stack

- **Frontend**: Next.js 14 (App Router), TypeScript, Material UI v5
- **Backend**: Next.js API Routes, Prisma ORM
- **Database**: PostgreSQL 16
- **Authentication**: NextAuth.js
- **AI**: OpenRouter API
- **Charts**: Recharts

## Prerequisites

- Node.js 20+ and Yarn
- Docker and Docker Compose (for local PostgreSQL)
- OpenRouter API key (for AI features)

## Getting Started

### One-Command Setup (Recommended)

**Prerequisites:** Make sure PostgreSQL is running on localhost:5432

```bash
# Start PostgreSQL (choose one method):
# macOS (Homebrew):
brew services start postgresql@16

# Linux:
sudo systemctl start postgresql

# Or use Docker:
docker-compose up -d

# Then start the app:
./start.sh
```

This script automatically:
- Checks prerequisites (Node.js, Yarn, PostgreSQL)
- Creates `.env` file if missing
- Installs dependencies
- Connects to your local PostgreSQL
- Creates the database if needed
- Sets up and seeds the database
- Starts the development server

**That's it!** Visit http://localhost:3000 and login with `admin@ptflow.ai` / `password123`

---

### Manual Setup

If you prefer manual setup:

#### 1. Clone and Install

```bash
cd physicalThreapy
yarn install
```

#### 2. Set Up PostgreSQL

Start PostgreSQL using Docker Compose:

```bash
docker-compose up -d
```

Verify PostgreSQL is running:

```bash
docker-compose ps
```

### 3. Configure Environment Variables

Copy the example environment file:

```bash
cp .env.example .env
```

Edit `.env` and update the following:

```env
# Database - keep as-is if using Docker Compose
DATABASE_URL="postgresql://postgres:postgres@localhost:5432/ptflow"

# NextAuth - generate a random secret
NEXTAUTH_SECRET="your-secret-key-here-change-in-production"
NEXTAUTH_URL="http://localhost:3000"

# OpenRouter AI - add your API key
OPENROUTER_API_KEY="sk-or-v1-your-key-here"
```

To generate a secure `NEXTAUTH_SECRET`:

```bash
openssl rand -base64 32
```

### 4. Set Up Database

Generate Prisma client and push schema to database:

```bash
npx prisma generate
npx prisma db push
```

### 5. Seed Database with Demo Data

Populate the database with realistic sample data:

```bash
yarn db:seed
```

This will create:
- 6 users (1 admin, 3 therapists, 2 staff)
- 10 patients with diverse PT conditions
- 20 common PT exercises
- Appointments (past and upcoming)
- Session notes with exercise logs
- Progress metrics showing improvement
- Insurance payers, policies, and claims
- Message threads

### 6. Start Development Server

```bash
yarn dev
```

Open [http://localhost:3000](http://localhost:3000) in your browser.

## Default Login Credentials

After seeding, you can log in with any of these accounts:

| Role | Email | Password |
|------|-------|----------|
| Admin | admin@ptflow.ai | password123 |
| Therapist | therapist1@ptflow.ai | password123 |
| Therapist | therapist2@ptflow.ai | password123 |
| Therapist | therapist3@ptflow.ai | password123 |
| Staff | frontdesk1@ptflow.ai | password123 |
| Staff | frontdesk2@ptflow.ai | password123 |

⚠️ **Important**: Change these passwords in production!

## Project Structure

```
physicalThreapy/
├── app/                      # Next.js App Router pages
│   ├── (auth)/              # Authentication pages (login, register)
│   ├── (dashboard)/         # Protected dashboard pages
│   │   ├── dashboard/       # Main dashboard
│   │   ├── patients/        # Patient management
│   │   ├── appointments/    # Scheduling
│   │   ├── billing/         # Claims & insurance
│   │   └── messages/        # Messaging system
│   └── api/                 # API routes
│       ├── auth/            # NextAuth
│       └── ai/              # AI endpoints
├── components/              # React components
│   ├── layout/              # Layout components
│   ├── patients/            # Patient-specific components
│   └── ui/                  # Reusable UI components
├── lib/                     # Utility libraries
│   ├── prisma.ts            # Prisma client
│   ├── ai.ts                # OpenRouter integration
│   └── auth.ts              # NextAuth configuration
├── prisma/
│   ├── schema.prisma        # Database schema
│   └── seed.ts              # Seed script
└── docker-compose.yml       # PostgreSQL setup
```

## Helper Scripts

Three convenient scripts are provided for common tasks:

### Start the Application

```bash
./start.sh
```

Automatically handles:
- Dependency installation
- PostgreSQL startup
- Database setup and seeding
- Development server startup

### Stop All Services

```bash
./stop.sh
```

Stops:
- Next.js development server
- PostgreSQL container

### Reset Database

```bash
./reset.sh
```

⚠️ **Warning**: Deletes all data and re-seeds with demo data.

---

## Database Commands

```bash
# Open Prisma Studio (database GUI)
yarn db:studio

# Reset database and re-seed
npx prisma db push --force-reset
yarn db:seed

# Create a migration
npx prisma migrate dev --name migration_name

# View database in terminal
docker-compose exec postgres psql -U postgres -d ptflow
```

## AI Features Configuration

PT Flow AI uses OpenRouter for AI capabilities. To enable AI features:

1. Sign up at [OpenRouter](https://openrouter.ai/)
2. Create an API key
3. Add the key to your `.env` file as `OPENROUTER_API_KEY`

### Available AI Endpoints

- **POST** `/api/ai/session-summary` - Generate session note summaries
- **POST** `/api/ai/home-plan` - Create personalized exercise plans
- **POST** `/api/ai/progress-summary` - Analyze patient progress
- **POST** `/api/ai/claim-justification` - Generate claim medical necessity text

## Development Workflow

1. **Make schema changes**: Edit `prisma/schema.prisma`
2. **Apply changes**: Run `npx prisma db push` (dev) or `npx prisma migrate dev` (production)
3. **Update seed data**: Modify `prisma/seed.ts` as needed
4. **Test**: Restart dev server and verify changes

## Sample Patient Data

The seed script creates 10 patients with realistic PT conditions:

- Post-op ACL reconstruction
- Chronic low back pain with radiculopathy
- Rotator cuff repair
- Lateral ankle sprain
- Total knee replacement
- Frozen shoulder
- Plantar fasciitis
- Cervical radiculopathy
- Patellar tendinopathy
- Achilles tendon repair

Each patient has:
- Complete medical history
- Insurance coverage
- Multiple appointments
- Session notes with exercises
- Progress metrics over time
- Message threads

## Production Deployment

### Environment Variables

Ensure these are set in production:

- `DATABASE_URL`: PostgreSQL connection string
- `NEXTAUTH_SECRET`: Strong random secret (use `openssl rand -base64 32`)
- `NEXTAUTH_URL`: Your production URL
- `OPENROUTER_API_KEY`: Your OpenRouter API key

### Database

For production, use a managed PostgreSQL service like:
- AWS RDS
- Google Cloud SQL
- Supabase
- Neon
- Railway

### Build

```bash
yarn build
yarn start
```

## Security Notes

- All passwords are hashed with bcrypt (10 rounds)
- NextAuth handles session management
- API routes are protected with authentication middleware
- OpenRouter API key is only used server-side (never exposed to client)
- All PHI data should be treated according to HIPAA guidelines

## Browser Support

- Chrome/Edge (latest)
- Firefox (latest)
- Safari (latest)

## License

MIT

## Support

For issues and questions, please contact the development team.
