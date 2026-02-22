# PNHS ACCESS Portal
Academic Content & Community Enhancement System
Pantabangan National High School — Villarica, Pantabangan, Nueva Ecija

## Tech Stack
- **Framework**: Next.js 14 (App Router)
- **Database**: SQLite via Prisma ORM
- **Auth**: JWT (jose) + HTTP-only cookies
- **Styling**: Tailwind CSS
- **Deployment**: Vercel

## Quick Start

### 1. Install dependencies
```bash
npm install
```

### 2. Set up environment
```bash
cp .env.example .env
# Edit .env if needed (default uses SQLite file)
```

### 3. Set up database & seed data
```bash
npx prisma db push
npx tsx prisma/seed.ts
```

### 4. Run development server
```bash
npm run dev
```

Open [http://localhost:3000](http://localhost:3000)

## Demo Credentials
| Role    | Username  | Password    |
|---------|-----------|-------------|
| Admin   | admin     | admin123    |
| Teacher | teacher1  | teacher123  |
| Student | student1  | student123  |

## Features

### Admin Dashboard
- User management (create/view students, teachers, admins)
- Student & teacher listings
- Class management
- Announcement posting
- Academic performance reports

### Teacher Dashboard
- View assigned classes & students
- Enter and update grades by quarter
- Take daily attendance
- View announcements

### Student Dashboard
- View personal grades by quarter per subject
- View attendance history & summary
- Profile information
- School announcements

## Deploy to Vercel

### Option 1: Vercel + SQLite (for demo/small scale)
1. Push code to GitHub
2. Import repo on Vercel
3. Add environment variables:
   - `DATABASE_URL=file:/tmp/dev.db`
   - `JWT_SECRET=your-strong-secret`
4. Deploy

### Option 2: Vercel + PlanetScale/Neon (production)
1. Create a MySQL (PlanetScale) or PostgreSQL (Neon) database
2. Update `prisma/schema.prisma` provider: `"postgresql"` or `"mysql"`
3. Set `DATABASE_URL` to your cloud database URL
4. Deploy to Vercel

## Project Structure
```
pnhs-access/
├── app/
│   ├── page.tsx                    # Landing page
│   ├── auth/login/page.tsx         # Login page
│   ├── api/                        # API routes
│   │   ├── auth/login, logout, me
│   │   ├── admin/stats, users
│   │   ├── teacher/classes, grades, attendance
│   │   ├── student/grades, attendance, profile
│   │   └── announcements
│   └── dashboard/
│       ├── admin/                  # Admin pages
│       ├── teacher/                # Teacher pages
│       └── student/                # Student pages
├── components/
│   └── layout/Sidebar, TopBar
├── lib/
│   ├── prisma.ts                   # DB client
│   └── auth.ts                     # JWT helpers
├── prisma/
│   ├── schema.prisma               # DB schema
│   └── seed.ts                     # Sample data
└── middleware.ts                   # Auth + role routing
```
