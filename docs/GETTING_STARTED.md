# Getting Started with PT Flow AI

This guide will walk you through setting up and running PT Flow AI on your local machine.

## Quick Start (5 minutes)

### 1. Start PostgreSQL

```bash
docker-compose up -d
```

This starts PostgreSQL in the background. Verify it's running:

```bash
docker-compose ps
```

You should see `ptflow-postgres` with status "Up".

### 2. Set Up Database

Generate Prisma Client and push schema to database:

```bash
npx prisma generate
npx prisma db push
```

### 3. Seed with Demo Data

```bash
yarn db:seed
```

This creates:
- 6 users (admin, 3 therapists, 2 staff members)
- 10 patients with realistic PT conditions
- 20 common PT exercises
- Multiple appointments, session notes, and progress data
- Insurance information and claims
- Message threads

### 4. Start Development Server

```bash
yarn dev
```

Open http://localhost:3000 in your browser.

### 5. Login

Use any of these demo credentials:

| Email | Password | Role |
|-------|----------|------|
| admin@ptflow.ai | password123 | Admin |
| therapist1@ptflow.ai | password123 | Therapist (Dr. Sarah Johnson) |
| therapist2@ptflow.ai | password123 | Therapist (Dr. Michael Chen) |
| therapist3@ptflow.ai | password123 | Therapist (Dr. Emily Rodriguez) |

---

## Detailed Setup

### Prerequisites

Before you begin, ensure you have:

- **Node.js 20+** - [Download](https://nodejs.org/)
- **Yarn** - Install with `npm install -g yarn`
- **Docker Desktop** - [Download](https://www.docker.com/products/docker-desktop/)

### Step-by-Step Installation

#### 1. Install Dependencies

```bash
yarn install
```

This installs all required packages including:
- Next.js 14
- Material UI v5
- Prisma ORM
- NextAuth.js
- Recharts (for progress charts)

#### 2. Configure Environment Variables

The `.env` file has been created with default values. For AI features to work, you need to add an OpenRouter API key:

1. Sign up at https://openrouter.ai/
2. Create an API key
3. Edit `.env` and add your key:

```env
OPENROUTER_API_KEY="sk-or-v1-your-actual-key-here"
```

**Note:** The app will run without an OpenRouter key, but AI features will be disabled.

#### 3. Database Setup

Start PostgreSQL:

```bash
docker-compose up -d
```

View logs to ensure it's running properly:

```bash
docker-compose logs -f postgres
```

Press Ctrl+C to exit logs.

Generate Prisma Client:

```bash
npx prisma generate
```

Push schema to database:

```bash
npx prisma db push
```

Seed with demo data:

```bash
yarn db:seed
```

#### 4. Verify Installation

Start the dev server:

```bash
yarn dev
```

You should see:

```
▲ Next.js 14.x.x
- Local:        http://localhost:3000
- Ready in xxxms
```

Visit http://localhost:3000 and you should see the login page.

---

## Exploring the Application

### Dashboard

After logging in, you'll see:
- **Stats**: Patient count, today's appointments, claims status
- **Today's Schedule**: List of appointments for the day
- **Quick Stats**: Claims breakdown by status

### Navigation

Use the left sidebar to access:
- **Dashboard** - Overview and today's schedule
- **Patients** - Patient management (coming soon)
- **Appointments** - Schedule management (coming soon)
- **Session Notes** - Documentation (coming soon)
- **Billing** - Claims and insurance (coming soon)
- **Messages** - Secure messaging (coming soon)
- **Settings** - Application settings (coming soon)

### Sample Data

The seed script creates realistic data:

**Patients include:**
- John Anderson - Post-op ACL reconstruction
- Maria Garcia - Chronic low back pain
- Robert Johnson - Rotator cuff repair
- Lisa Thompson - Ankle sprain
- William Davis - Total knee replacement
- Jennifer Martinez - Frozen shoulder
- And 4 more patients with various conditions

**Exercises include:**
- Straight Leg Raise
- Clamshells
- Bridging
- Wall Slides
- And 16 more common PT exercises

---

## Database Management

### Viewing Data

Open Prisma Studio (database GUI):

```bash
yarn db:studio
```

This opens a web interface at http://localhost:5555 where you can browse and edit all data.

### Resetting Database

To completely reset and re-seed:

```bash
npx prisma db push --force-reset
yarn db:seed
```

**Warning:** This deletes all data!

### Direct PostgreSQL Access

Connect to PostgreSQL directly:

```bash
docker-compose exec postgres psql -U postgres -d ptflow
```

Useful commands:
```sql
\dt                    -- List all tables
SELECT * FROM users;   -- View users
\q                     -- Quit
```

---

## Testing AI Features

The application includes 4 AI-powered endpoints:

### 1. Session Note Summarizer

**What it does:** Generates clinical and patient-friendly summaries of therapy sessions.

**To test:**
1. Ensure `OPENROUTER_API_KEY` is set in `.env`
2. Use the Session Notes feature (implementation in progress)
3. Click "Generate AI Summary" on any session note

**API Endpoint:**
```bash
POST /api/ai/session-summary
Content-Type: application/json

{
  "sessionNote": { ... },
  "patient": { ... },
  "exercises": [ ... ]
}
```

### 2. Home Exercise Plan Generator

**What it does:** Creates personalized exercise programs based on diagnosis and goals.

**API Endpoint:**
```bash
POST /api/ai/home-plan
Content-Type: application/json

{
  "diagnosis": "ACL reconstruction",
  "bodyRegion": "KNEE",
  "goals": "Improve strength and ROM",
  "equipment": "Resistance bands, stability ball"
}
```

### 3. Progress Summary

**What it does:** Analyzes patient progress metrics and generates encouraging summaries.

**API Endpoint:**
```bash
POST /api/ai/progress-summary
Content-Type: application/json

{
  "patient": { ... },
  "metrics": [ ... ]
}
```

### 4. Claim Justification Generator

**What it does:** Creates medical necessity justifications for insurance claims.

**API Endpoint:**
```bash
POST /api/ai/claim-justification
Content-Type: application/json

{
  "claim": { ... },
  "patient": { ... },
  "sessionNotes": [ ... ]
}
```

---

## Troubleshooting

### Port 5432 Already in Use

If you get "port 5432 is already in use":

1. Stop any existing PostgreSQL instances
2. Or change the port in `docker-compose.yml`:

```yaml
ports:
  - '5433:5432'  # Use 5433 instead
```

Then update `DATABASE_URL` in `.env`:
```
DATABASE_URL="postgresql://postgres:postgres@localhost:5433/ptflow"
```

### Prisma Client Not Generated

If you see "Cannot find module '@prisma/client'":

```bash
npx prisma generate
```

### Database Connection Failed

1. Check PostgreSQL is running:
```bash
docker-compose ps
```

2. Check logs:
```bash
docker-compose logs postgres
```

3. Restart PostgreSQL:
```bash
docker-compose restart postgres
```

### Next.js Port 3000 in Use

Start on a different port:

```bash
yarn dev -p 3001
```

Then update `NEXTAUTH_URL` in `.env`:
```
NEXTAUTH_URL="http://localhost:3001"
```

### AI Features Not Working

Check:
1. `OPENROUTER_API_KEY` is set in `.env`
2. The key is valid (check https://openrouter.ai/keys)
3. You have credits in your OpenRouter account
4. Check browser console and server logs for errors

---

## Development Tips

### Watch Database Changes

Keep Prisma Studio open in a separate terminal:

```bash
yarn db:studio
```

### View Server Logs

Development server logs appear in your terminal. For detailed logging, check the browser console (F12).

### Hot Reload

Next.js automatically reloads when you edit files. No need to restart the server for most changes.

### Schema Changes

After editing `prisma/schema.prisma`:

1. Push changes:
```bash
npx prisma db push
```

2. Regenerate client:
```bash
npx prisma generate
```

3. Restart dev server (Ctrl+C, then `yarn dev`)

---

## What's Included

### ✅ Completed

- PostgreSQL database with comprehensive schema
- User authentication with NextAuth.js
- Role-based access control (Admin, Therapist, Staff)
- Material UI theme and layout
- Dashboard with real-time stats
- Seed script with realistic PT clinic data
- 4 AI-powered API endpoints
- Docker setup for PostgreSQL
- Comprehensive documentation

### 🚧 Foundation Ready for Development

The following features have the data models and API structure ready, but need UI implementation:

- Patient management pages
- Appointment scheduling with calendar
- Session notes with SOAP format
- Exercise library and tracking
- Progress charts and metrics
- Billing and claims management
- Messaging system
- Settings and preferences

All the database models, relationships, and sample data are in place. You can build upon this foundation to create a complete PT practice management system.

---

## Next Steps

Now that you have the foundation running:

1. **Explore the data** - Open Prisma Studio and browse the seeded data
2. **Test authentication** - Try logging in with different user roles
3. **Review the schema** - Check `prisma/schema.prisma` to understand the data model
4. **Add features** - Build patient management, scheduling, or any other feature
5. **Test AI endpoints** - Try the AI features with your OpenRouter API key

## Support

For issues or questions:
- Check the troubleshooting section above
- Review the README.md for additional information
- Inspect server logs and browser console for errors

Happy coding! 🚀
