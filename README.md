<<<<<<< HEAD
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
=======
# PNHS-ACCESS - Academic Comprehensive Connectivity Enhanced Student System

## 🎓 About
PNHS-ACCESS is a comprehensive web-based portal system for Pantabangan National High School. It provides secure authentication and enhanced student services for administrators, teachers, and students.

## ✨ Features

### 🔐 Secure Authentication
- Role-based access control (Admin, Teacher, Student)
- Secure login system
- Password-protected accounts

### 👨‍💼 Admin Dashboard
- Student management
- Teacher management
- Class management
- Analytics and reporting
- System settings

### 👩‍🏫 Teacher Portal
- Class management
- Attendance tracking
- Grade submission
- Student records access
- Schedule viewing

### 👨‍🎓 Student Portal
- View grades
- Check schedule
- View assignments
- Track attendance
- Access announcements

## 🚀 Quick Start

### Prerequisites
- Node.js 18 or higher
- npm or yarn

### Installation

1. **Extract the project folder**
   ```bash
   cd pnhs-access
   ```

2. **Install dependencies**
   ```bash
   npm install
   ```

3. **Run development server**
   ```bash
   npm run dev
   ```

4. **Open browser**
   Navigate to `http://localhost:3000`

## 🌐 Deployment to Vercel

### Option 1: Using Vercel CLI

1. **Install Vercel CLI**
   ```bash
   npm install -g vercel
   ```

2. **Deploy**
   ```bash
   vercel
   ```

### Option 2: Using Vercel Dashboard

1. **Push to GitHub**
   ```bash
   git init
   git add .
   git commit -m "Initial commit"
   git remote add origin YOUR_GITHUB_REPO_URL
   git push -u origin main
   ```

2. **Go to Vercel Dashboard**
   - Visit https://vercel.com
   - Click "New Project"
   - Import your GitHub repository
   - Click "Deploy"

### Option 3: Direct Deployment

1. **Go to Vercel**
   - Visit https://vercel.com/new
   - Drag and drop the `pnhs-access` folder
   - Click "Deploy"

## 🔑 Demo Credentials

### Administrator
- **Username:** admin
- **Password:** admin123

### Teacher
- **Username:** teacher1
- **Password:** teacher123

### Student
- **Username:** student1
- **Password:** student123

## 📁 Project Structure

```
pnhs-access/
├── app/
│   ├── admin/
│   │   └── dashboard/
│   ├── teacher/
│   │   └── dashboard/
│   ├── student/
│   │   └── dashboard/
│   ├── login/
│   ├── globals.css
│   ├── layout.tsx
│   └── page.tsx
├── lib/
│   └── auth.ts
├── public/
├── .gitignore
├── next.config.js
├── package.json
├── postcss.config.js
├── tailwind.config.js
└── tsconfig.json
```

## 🛠 Technology Stack

- **Framework:** Next.js 14 (App Router)
- **Language:** TypeScript
- **Styling:** Tailwind CSS
- **Icons:** Lucide React
- **Deployment:** Vercel

## 📝 Available Scripts

- `npm run dev` - Start development server
- `npm run build` - Build for production
- `npm start` - Start production server
- `npm run lint` - Run ESLint

## 🎨 Features Overview

### Landing Page
- Modern, responsive design
- PNHS branding
- Feature highlights
- Call-to-action buttons

### Authentication System
- Secure login
- Role-based redirects
- Session management
- Password visibility toggle

### Admin Dashboard
- User statistics
- Quick actions
- Recent activity
- Comprehensive management tools

### Teacher Dashboard
- Class overview
- Task management
- Quick actions for attendance and grades
- Student records access

### Student Dashboard
- Grade tracking
- Schedule viewing
- Announcements
- Performance analytics

## 🔒 Security Features

- Role-based access control
- Secure authentication
- Protected routes
- Session management

## 🌟 Future Enhancements

- Database integration (MongoDB/PostgreSQL)
- Email notifications
- File upload functionality
- Advanced reporting
- Mobile app version
- Parent portal

## 📧 Support

For support, email: support@pnhs.edu.ph

## 📄 License

Copyright © 2026 Pantabangan National High School. All rights reserved.

---

**Developed for Pantabangan National High School**
*Empowering Education Through Technology*
>>>>>>> abd22b2953a867c47a19ce65745932cb9bbe898c
