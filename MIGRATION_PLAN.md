# Migration Plan — PNHS ACCESS

Goal: migrate demo/localStorage data to Prisma (SQLite), normalize schema later, secure sessions, and make dashboards use Prisma APIs as single source of truth.

Overview:

1. Backup current data and repo.
2. Add `SESSION_SECRET` env variable to production and local `.env` for dev.
3. Seed the SQLite DB with baseline data (use `prisma/seed.sql` provided).
4. Run `npx prisma migrate dev --name init` to ensure DB and client are in sync.
5. Implement schema normalization in a separate migration (add relation tables for classes/students/teachers), and create a data migration script to convert old rows.
6. Update server APIs to use relations and return sanitized payloads.
7. Remove `lib/shared-data.ts` localStorage usage and change frontends to call server APIs exclusively.
8. Run manual tests and a smoke test script.

Commands (dev):

- Install dependencies (if not installed):

```bash
npm install
```

- Set a dev session secret (on Windows PowerShell):

```powershell
$env:SESSION_SECRET = "dev-secret-please-change"
```

- Push schema / run migrations (after creating/modifying migrations):

```bash
npx prisma migrate dev --name init
```

- Seed SQLite directly (if you have `sqlite3` CLI):

```bash
sqlite3 ./dev.db < prisma/seed.sql
```

(Or run a Prisma-compatible seed script if you add one.)

Verification:

- Use `sqlite3` or `npx prisma studio` to verify tables and rows:

```bash
npx prisma studio
```

Notes & next steps:

- I will next propose an explicit Prisma schema normalization patch and migration scripts. That will include converting `Teacher.subjects` from JSON string to a related `Subject` model and creating a many-to-many `Enrollment` table for students/classes.
- Expect manual data migration work when changing column types or relations; I will prepare scripts to migrate the sample data.
