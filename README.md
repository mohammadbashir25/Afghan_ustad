# AfghanUstad — Rebuild notes (13 October 2026)

## Changes in this rebuild

- Fixed repeated sidebar links for monthly tests and daily expenses.
- Split the student login route into its own root layout, so `/student/login` no longer redirects into the staff login and student dashboard pages require a student session.
- Added the missing Vercel Blob runtime packages to `package.json` (`async-retry`, `is-buffer`, `is-node-process`, `throttleit`, and `undici`) to address the module-not-found errors from the supplied log. Run `npm install` once so npm updates the lockfile and installs them.
- Connected homepage courses, the public course catalogue, and course-detail lookup to active MongoDB course records.
- Expanded course creation for Super Admin and Manager: unique slug, required thumbnail upload, level, fee, status, featured flag, and required English/Dari/Pashto names, categories, durations, and descriptions.
- Added MongoDB-backed success stories/testimonials with three-language fields, optional photo upload, explicit consent confirmation, approval gating, and homepage/full-page rendering. Public pages show no fabricated testimonial or hard-coded sample course records.
- Connected the homepage student-verification component to `/api/student-verification`, which queries active student records and returns only public verification fields.
- Removed duplicated navigation entries and added `data-scroll-behavior="smooth"` for Next.js route transitions.
- Added monthly-test question/task authoring: at least two questions, multiple-choice questions with four options and a correct answer, practical/project-upload question types, practical tasks, point values, and upload requirements.
- Added assignment guide/tips fields and displayed them in the student assignment page.

## Validation status

- `npx tsc --noEmit`: passed in the working environment.
- ESLint: passed with no errors or warnings in the working environment.
- Production build: **not verified**. The build runner could not download the platform-specific Next.js SWC binary because access to `registry.npmjs.org` failed. This is an environment/network limitation, not proof that the production build passes.
- Real MongoDB and Vercel Blob flows still require your own `.env.local` values and manual integration testing. Do not deploy until the production build and the checklist below pass on your machine or CI.

## Install and test on Windows

```powershell
npm install
npm run typecheck
npm run lint
npm run build
npm run dev
```

Use `npm install` first (not `npm ci`) so npm refreshes the lockfile with the newly declared Blob dependencies. Keep `.env.local` private; use `.env.example` only as a template. Ensure `MONGODB_URI`, `AUTH_SECRET`, and `BLOB_READ_WRITE_TOKEN` are configured locally and in Vercel.

---

# AfghanUstad Course Management System

A multilingual education and course-management application built with Next.js App Router, TypeScript, Tailwind CSS v4, Auth.js credentials authentication, Mongoose, and MongoDB Atlas.

## Included features

- Public landing page and public pages for About, Courses, Course Details, Skill Center, Success Stories, and Contact in English, Dari, and Pashto.
- Role-based staff authentication for Super Admin, Manager, and Guide.
- Student login using Student ID + username + PIN. PINs are bcrypt-hashed and are never printed on receipts.
- Student registration with unique Student ID/username and optional initial payment receipt.
- User and student account management, including activation/deactivation.
- Database-backed course and class catalogues with create forms.
- Payment history and finance reporting from recorded payments.
- Attendance records, class attendance reports, assignment creation, and assessment/marks records.
- Student pages for courses, attendance, assignments, marks, progress, and leaderboard.
- Guide dashboard with assigned classes, students, attendance, and assignments.
- Production-protected diagnostic endpoints and a token-protected one-time Super Admin setup endpoint.

## Requirements

- Node.js 20.9+ (Node 22 LTS recommended for deployment)
- npm
- MongoDB Atlas database and a database user with only the required database permissions

## Local setup

1. Extract this project.
2. Install dependencies:

   ```bash
   npm ci
   ```

3. Copy `.env.example` to `.env.local` and fill in your own values. Never commit `.env.local`.
4. Start the development server:

   ```bash
   npm run dev
   ```

5. Open `http://localhost:3000`.
6. Run static checks before pushing:

   ```bash
   npx tsc --noEmit
   npm run lint
   npm run build
   ```

## Environment variables

- `MONGODB_URI`: MongoDB Atlas connection URI for the `afghanustad` database.
- `AUTH_SECRET`: long random secret used to sign Auth.js sessions. Generate one with `openssl rand -base64 32` or an equivalent secure generator.
- `NEXT_PUBLIC_SITE_URL`: canonical production origin, e.g. `https://your-domain.com`.
- `RESEND_API_KEY`: private Resend API key used only by the server-side contact endpoint.
- `CONTACT_TO_EMAIL`: inbox that should receive contact-form messages.
- `CONTACT_FROM_EMAIL`: sender address verified in Resend, e.g. `AfghanUstad Website <contact@your-domain.com>`.
- `ADMIN_SETUP_EMAIL`: exact email address permitted for initial Super Admin creation.
- `ADMIN_SETUP_TOKEN`: one-time setup token of at least 32 characters. Remove it from the environment immediately after creating the first Super Admin.

## Contact form email delivery (Resend)

The contact form posts to `/api/contact`; it no longer shows a false success state without sending. The route validates input on the server and sends the message through Resend’s HTTPS API. Configure `RESEND_API_KEY`, `CONTACT_TO_EMAIL`, and `CONTACT_FROM_EMAIL` in `.env.local` and in Vercel. The sender must be a domain/address verified in your Resend account. If those variables are absent, the form displays a recoverable error instead of claiming delivery.

## Initial Super Admin setup

The bootstrap endpoint is deliberately closed unless both `ADMIN_SETUP_EMAIL` and a strong `ADMIN_SETUP_TOKEN` are configured. Make a one-time POST request from a trusted environment, substituting your own values:

```bash
curl -X POST "https://your-domain.com/api/admin/setup" \
  -H "Content-Type: application/json" \
  -H "x-setup-token: YOUR_LONG_ONE_TIME_TOKEN" \
  -d '{"name":"Your Admin Name","email":"admin@example.com","password":"Use-A-Unique-Long-Password-123"}'
```

Use the exact email configured in `ADMIN_SETUP_EMAIL` and a unique password of at least 12 characters. After success, remove `ADMIN_SETUP_TOKEN` from your deployment environment and redeploy. The endpoint refuses setup if a Super Admin already exists.

If a Super Admin already exists in your database, do not run the bootstrap endpoint; sign in using the existing account.

## Deploy to Vercel

1. Push the project to a private or public Git repository.
2. Import the repository into Vercel.
3. Add the production environment variables in Vercel Project Settings. Do not upload `.env.local`.
4. Confirm the MongoDB Atlas network-access rules permit the deployment environment and use a least-privilege database user.
5. Set `NEXT_PUBLIC_SITE_URL` to the final HTTPS domain.
6. Deploy and review the build logs.
7. Create the first Super Admin only if one does not already exist, then remove `ADMIN_SETUP_TOKEN`.
8. Test login, student registration, payment receipts, course/class creation, attendance, assignments, assessment records, and student-role access in production.

## Data notes

- Student registration currently requires an email address because the existing `User` schema requires one.
- Student PINs are stored as bcrypt hashes. The initial PIN is displayed to the registering staff member in the success confirmation only and is excluded from the printable receipt.
- The payment model records payment transactions, not formal invoices or expense accounting. Outstanding balances are calculated from the latest payment record per student/course; overdue balances are not inferred because the current payment schema does not define a due date.
- Assignment submission tracking is not yet a full workflow: assignments can be published and students can view them, but file uploads, submissions, review feedback, and submission-level completion charts require an additional submission model and UI.
- Public course content and management-dashboard course records are separate sources at present; synchronize them before relying on dashboard-created courses to automatically update public course pages.

## Security reminders

- Never commit `.env.local`, database credentials, `AUTH_SECRET`, or `ADMIN_SETUP_TOKEN`.
- Use HTTPS in production.
- Keep the Super Admin bootstrap token temporary.
- Create a separate MongoDB user for the application and restrict its permissions.
- Before opening enrollment broadly, test all role boundaries using separate Super Admin, Manager, Guide, and Student accounts.

## Dashboard rebuild (October 2026)

The public landing page and its localized public routes under `app/[locale]` were intentionally left unchanged. The dashboard navigation and pages are role-specific:

- **Super Admin**: overview, students (including edit/deactivate/delete), registration, staff/users, courses, batches/schedules, attendance, assignments/reviews, guide performance, Skill Center, student performance/KPI, leaderboard/talent bookmarks, finance/payments/expenses, reports, website/content announcements, audit logs, and settings.
- **Manager**: overview, student registration and editing/deactivation, courses, batches/schedules, attendance, Skill Center, assignments/submissions, evaluations/KPI, guide workload, operational finance/payment recording, reports, and announcements. There is no student-delete control, and the server action rejects Manager deletion requests.
- **Guide**: overview, assigned students, sessions, assignments, submission reviews/feedback, assigned-session attendance, KPI evaluations, student progress, guidance history/follow-up notes, and guide performance.
- **Student**: overview, assessment-based leaderboard (including the student's own rank), course, schedule, attendance, assignments/submissions/feedback, performance/KPI, own payment history/receipts, profile, and PIN change.

New dashboard data uses the existing MongoDB/Mongoose stack. Additional models were added for assignment submissions, audit logs, announcements, expenses, talent bookmarks, and guidance notes. Sensitive actions such as student deletion, payment recording, expense recording, talent bookmarks, student record changes, and PIN changes are logged when successful.

### Permissions

- Only `SUPER_ADMIN` can permanently delete a student. The action checks role server-side, snapshots the student's identity onto retained financial payment records, removes their attendance/performance/submission records, and writes an audit log.
- `MANAGER` can register/edit/deactivate students and record authorized payments, but cannot delete students or manage staff roles.
- `GUIDE` actions are scoped to assigned classes/courses for attendance, assignments, evaluations, submissions, and guidance notes.
- `STUDENT` pages/actions operate on the authenticated student's own account and records.

### Validation status

`npx tsc --noEmit` and `npm run lint` pass in the prepared working copy. A production build could not be completed in this environment because the Linux Next.js SWC binary is missing and the build environment could not reach `registry.npmjs.org` to fetch it. Run `npm ci` and `npm run build` on the deployment machine after configuring `.env.local`/hosting environment variables.


### Assignment file uploads

Student file uploads use Vercel Blob. Configure `BLOB_READ_WRITE_TOKEN` in local `.env.local` and in the deployment environment. Text submissions and HTTPS links remain available, but actual file uploads require the token. Uploaded files are public URLs, so students must not upload private or sensitive documents.


After pulling this rebuild, run `npm install` (not `npm ci` on the old lockfile) once so the new `@vercel/blob` dependency is recorded in your local lockfile. Then configure `BLOB_READ_WRITE_TOKEN` in `.env.local` and your deployment environment before testing file uploads.
