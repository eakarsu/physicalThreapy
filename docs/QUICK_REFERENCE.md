# PT Flow AI - Quick Reference Card

## Quick Start

```bash
# Start everything (recommended)
./start.sh

# Stop everything
./stop.sh

# Reset database (⚠️ deletes all data)
./reset.sh
```

---

## Common Commands

### Development

```bash
# Start development server
yarn dev

# Build for production
yarn build

# Run production server
yarn start
```

### Database

```bash
# Start PostgreSQL
docker-compose up -d

# Stop PostgreSQL
docker-compose down

# View PostgreSQL logs
docker-compose logs -f postgres

# Open database GUI
yarn db:studio

# Push schema changes
npx prisma db push

# Generate Prisma client
npx prisma generate

# Seed database
yarn db:seed

# Reset database (⚠️  deletes all data)
npx prisma db push --force-reset
yarn db:seed
```

### Direct PostgreSQL Access

```bash
# Connect to database
docker-compose exec postgres psql -U postgres -d ptflow

# Common SQL commands
\dt                    # List tables
\d table_name          # Describe table
SELECT * FROM users;   # Query users
\q                     # Quit
```

## Default Credentials

| Email | Password | Role |
|-------|----------|------|
| admin@ptflow.ai | password123 | Admin |
| therapist1@ptflow.ai | password123 | Therapist |
| therapist2@ptflow.ai | password123 | Therapist |
| therapist3@ptflow.ai | password123 | Therapist |
| frontdesk1@ptflow.ai | password123 | Staff |
| frontdesk2@ptflow.ai | password123 | Staff |

## Environment Variables

```env
DATABASE_URL="postgresql://postgres:postgres@localhost:5432/ptflow"
NEXTAUTH_SECRET="your-secret-here"
NEXTAUTH_URL="http://localhost:3000"
OPENROUTER_API_KEY="sk-or-v1-your-key"
```

## API Endpoints

### Authentication
- `POST /api/auth/signin` - Sign in
- `POST /api/auth/signout` - Sign out
- `GET /api/auth/session` - Get session

### AI Features
- `POST /api/ai/session-summary` - Generate session summaries
- `POST /api/ai/home-plan` - Create exercise plans
- `POST /api/ai/progress-summary` - Analyze progress
- `POST /api/ai/claim-justification` - Generate claim text

## URLs

- **Application**: http://localhost:3000
- **Prisma Studio**: http://localhost:5555 (run `yarn db:studio` first)

## Project Structure

```
app/
  ├── api/              # API routes
  ├── dashboard/        # Dashboard pages
  ├── login/            # Login page
  └── layout.tsx        # Root layout

components/
  ├── layout/           # Layout components
  └── providers/        # Context providers

lib/
  ├── prisma.ts         # Database client
  ├── auth.ts           # Auth config
  └── ai.ts             # AI utilities

prisma/
  ├── schema.prisma     # Database schema
  └── seed.ts           # Seed data
```

## Troubleshooting

### Port 5432 in use
```bash
# Use different port
docker-compose down
# Edit docker-compose.yml: ports: - '5433:5432'
# Update DATABASE_URL in .env
```

### Prisma client errors
```bash
npx prisma generate
```

### Database connection failed
```bash
docker-compose restart postgres
docker-compose logs postgres
```

### Next.js won't start
```bash
# Try different port
yarn dev -p 3001
```

### Clear everything and start fresh
```bash
docker-compose down -v
docker-compose up -d
npx prisma db push
yarn db:seed
```

## Useful Prisma Studio Queries

In Prisma Studio (http://localhost:5555):

1. **View all patients with their appointments**
   - Click `patient` table
   - Select a patient
   - See related `appointments` in the sidebar

2. **Find session notes**
   - Click `session_notes` table
   - Filter by patient or therapist

3. **Check claims status**
   - Click `claims` table
   - Group by `status` column

## File Locations

| What | Where |
|------|-------|
| Database schema | `prisma/schema.prisma` |
| Seed data | `prisma/seed.ts` |
| Auth config | `lib/auth.ts` |
| AI utilities | `lib/ai.ts` |
| Main layout | `components/layout/DashboardLayout.tsx` |
| Dashboard | `app/dashboard/page.tsx` |
| Login page | `app/login/page.tsx` |
| AI endpoints | `app/api/ai/*/route.ts` |

## Key Database Tables

- `users` - Authentication and staff
- `patients` - Patient records
- `appointments` - Scheduling
- `session_notes` - SOAP documentation
- `exercises` - Exercise library
- `session_exercises` - Exercises per session
- `progress_metrics` - Outcome measures
- `claims` - Billing
- `insurance_payers` - Insurance companies
- `insurance_policies` - Patient coverage
- `message_threads` & `messages` - Messaging

## Seeded Data Summary

- **Users**: 6 (1 admin, 3 therapists, 2 staff)
- **Patients**: 10 with realistic PT conditions
- **Exercises**: 20 common PT exercises
- **Appointments**: Multiple per patient
- **Session Notes**: Detailed SOAP notes
- **Progress Metrics**: Time-series data showing improvement
- **Claims**: Various statuses (draft, submitted, paid, denied)
- **Messages**: Sample conversations

## Getting Help

1. Check `GETTING_STARTED.md` for setup
2. Read `README.md` for detailed docs
3. Review `PROJECT_SUMMARY.md` for architecture
4. Check browser console (F12) for errors
5. Check server terminal for logs
6. Use Prisma Studio to inspect data

## Quick Test Checklist

- [ ] PostgreSQL running (`docker-compose ps`)
- [ ] Dependencies installed (`yarn install`)
- [ ] Prisma client generated (`npx prisma generate`)
- [ ] Database pushed (`npx prisma db push`)
- [ ] Data seeded (`yarn db:seed`)
- [ ] Dev server started (`yarn dev`)
- [ ] Can login at http://localhost:3000
- [ ] Dashboard shows data
- [ ] (Optional) OpenRouter API key set for AI features

---

**Happy coding!** For detailed information, see `GETTING_STARTED.md` and `README.md`.
