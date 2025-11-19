# AI Competition Platform

> **The Noders PTNK** - A modern web platform for hosting AI/Machine Learning competitions with automated CSV submission grading and real-time leaderboards.

![Tech Stack](https://img.shields.io/badge/Next.js-14-black)
![TypeScript](https://img.shields.io/badge/TypeScript-5-blue)
![Supabase](https://img.shields.io/badge/Supabase-Backend-green)
![Tailwind](https://img.shields.io/badge/Tailwind-3-cyan)

---

## 📚 Table of Contents

- [Features](#features)
- [Tech Stack](#tech-stack)
- [Project Structure](#project-structure)
- [Getting Started](#getting-started)
- [Environment Variables](#environment-variables)
- [Database Setup](#database-setup)
- [Development](#development)
- [Deployment](#deployment)
- [Documentation](#documentation)

---

## ✨ Features

### For Users
- 🔐 **Email-based authentication** with verification
- 🏆 **Browse and register** for AI/ML competitions
- 👥 **Team management** - Create teams or compete individually
- 📤 **CSV submission** with drag & drop upload
- 📊 **Real-time leaderboards** with best score tracking
- 📈 **Submission history** and analytics
- ⏱️ **Live countdown timers** for phase transitions

### For Admins
- 🎯 **Competition management** - Create and configure competitions
- ✅ **Registration approval** system
- 📉 **Analytics dashboard** with insights
- 🗂️ **Dataset management** - Upload answer keys securely
- 🔄 **Automated scoring** with F1 metric
- 📁 **Data export** capabilities

### Competition Features
- **Two competition types**:
  - 3-Phase: Registration → Test → Ended
  - 4-Phase: Registration → Public Test → Private Test → Ended
- **Flexible participation**: Individual or Team-based
- **Submission quotas**: Daily and total limits
- **Automatic validation**: CSV format and content checks
- **Best score selection**: Tracks highest score per participant
- **Tie-breaking**: By earliest submission time

---

## 🛠️ Tech Stack

### Frontend
- **Framework**: [Next.js 14](https://nextjs.org/) (App Router)
- **Language**: [TypeScript](https://www.typescriptlang.org/)
- **Styling**: [Tailwind CSS](https://tailwindcss.com/)
- **Icons**: [Lucide React](https://lucide.dev/)
- **Forms**: [React Hook Form](https://react-hook-form.com/) + [Zod](https://zod.dev/)
- **Charts**: [Recharts](https://recharts.org/)
- **CSV Parsing**: [PapaParse](https://www.papaparse.com/)
- **Date Utilities**: [date-fns](https://date-fns.org/)

### Backend
- **BaaS**: [Supabase](https://supabase.com/)
  - PostgreSQL Database
  - Authentication (Email/Password)
  - Row-Level Security (RLS)
  - Storage (File uploads)
  - Edge Functions (Serverless)

### Deployment
- **Frontend**: [Vercel](https://vercel.com/)
- **Backend**: Supabase Cloud

---

## 📁 Project Structure

```
competition-platform/
├── docs/                           # Documentation
│   ├── 01-project-requirements.md  # Feature specs & requirements
│   ├── 02-authentication-system.md # Auth flows & security
│   ├── 03-design-system.md         # UI/UX guidelines
│   └── 04-project-structure.md     # Database & architecture
│
├── supabase/
│   ├── migrations/                 # Database migrations
│   │   └── 001_initial_schema.sql  # Initial DB schema
│   └── functions/                  # Edge Functions
│       └── validate-csv/           # CSV validation & scoring
│
├── src/
│   ├── app/                        # Next.js App Router
│   │   ├── (auth)/                 # Authentication pages
│   │   ├── (public)/               # Public pages
│   │   ├── (user)/                 # Protected user pages
│   │   └── (admin)/                # Admin-only pages
│   │
│   ├── components/
│   │   ├── ui/                     # Base UI components
│   │   ├── layout/                 # Layout components
│   │   ├── competition/            # Competition-specific
│   │   ├── leaderboard/            # Leaderboard components
│   │   └── admin/                  # Admin components
│   │
│   ├── lib/
│   │   ├── supabase/               # Supabase clients
│   │   ├── utils/                  # Utility functions
│   │   └── constants.ts            # App constants
│   │
│   ├── types/                      # TypeScript types
│   └── middleware.ts               # Route protection
│
├── public/                         # Static assets
├── .env.local.example              # Environment variables template
├── package.json
├── tailwind.config.ts
└── tsconfig.json
```

---

## 🚀 Getting Started

### Prerequisites

- **Node.js** 18+ and npm/pnpm
- **Supabase Account** ([Sign up free](https://supabase.com/))
- **Git**

### Installation

1. **Clone the repository**

```bash
git clone https://github.com/your-org/competition-platform.git
cd competition-platform
```

2. **Install dependencies**

```bash
npm install
# or
pnpm install
```

3. **Set up environment variables**

```bash
cp .env.local.example .env.local
```

Edit `.env.local` and add your credentials:

```env
NEXT_PUBLIC_SUPABASE_URL=your-supabase-project-url
NEXT_PUBLIC_SUPABASE_ANON_KEY=your-supabase-anon-key
SUPABASE_SERVICE_ROLE_KEY=your-service-role-key
NEXT_PUBLIC_SITE_URL=http://localhost:3000
```

4. **Set up the database** (see [Database Setup](#database-setup))

5. **Run development server**

```bash
npm run dev
```

Open [http://localhost:3000](http://localhost:3000) in your browser.

---

## 🔐 Environment Variables

| Variable | Description | Required |
|----------|-------------|----------|
| `NEXT_PUBLIC_SUPABASE_URL` | Supabase project URL | ✅ |
| `NEXT_PUBLIC_SUPABASE_ANON_KEY` | Supabase anonymous key | ✅ |
| `SUPABASE_SERVICE_ROLE_KEY` | Supabase service role key (server-only) | ✅ |
| `NEXT_PUBLIC_SITE_URL` | Your site URL (for email redirects) | ✅ |

**Find these in**: Supabase Dashboard → Project Settings → API

---

## 🗄️ Database Setup

### 1. Create Supabase Project

1. Go to [Supabase Dashboard](https://app.supabase.com/)
2. Click "New Project"
3. Set a strong database password
4. Wait for project initialization

### 2. Run Migration

**Option A: Via Supabase Dashboard**

1. Go to SQL Editor
2. Copy contents of `supabase/migrations/001_initial_schema.sql`
3. Paste and run

**Option B: Via Supabase CLI**

```bash
# Install Supabase CLI
npm install -g supabase

# Login
supabase login

# Link to your project
supabase link --project-ref your-project-ref

# Run migration
supabase db push
```

### 3. Create Storage Buckets

In Supabase Dashboard → Storage → Create buckets:

- `submissions` (Private)
- `answer-keys` (Private)
- `avatars` (Public)
- `competition-assets` (Public)

### 4. Deploy Edge Function

```bash
# Deploy CSV validation function
supabase functions deploy validate-csv
```

### 5. Create Admin User

1. Sign up via the UI (`/signup`)
2. Verify email
3. Run SQL to promote to admin:

```sql
UPDATE users SET role = 'admin' WHERE email = 'your-email@example.com';
```

---

## 💻 Development

### Run Development Server

```bash
npm run dev
```

### Type Checking

```bash
npm run type-check
```

### Linting

```bash
npm run lint
```

### Build for Production

```bash
npm run build
npm start
```

---

## 📤 Deployment

### Deploy to Vercel

1. **Push to GitHub**

```bash
git add .
git commit -m "Initial commit"
git push origin main
```

2. **Import to Vercel**

- Go to [Vercel Dashboard](https://vercel.com/dashboard)
- Click "Import Project"
- Select your repository
- Add environment variables
- Deploy!

3. **Configure Domain**

- Add custom domain in Vercel project settings
- Update `NEXT_PUBLIC_SITE_URL` environment variable

### Supabase Configuration

1. **Update Site URL** in Supabase Dashboard:
   - Authentication → URL Configuration
   - Add your production URL

2. **Configure Email Templates**:
   - Authentication → Email Templates
   - Customize verification and password reset emails

---

## 📖 Documentation

Detailed documentation available in `/docs`:

- **[01-project-requirements.md](docs/01-project-requirements.md)** - Complete feature specifications, user flows, and success criteria
- **[02-authentication-system.md](docs/02-authentication-system.md)** - Authentication flows, RLS policies, and security best practices
- **[03-design-system.md](docs/03-design-system.md)** - Design tokens, component guidelines, and UI patterns
- **[04-project-structure.md](docs/04-project-structure.md)** - Database schema, folder structure, and API patterns

---

## 🎨 Design System

This project follows **The Noders PTNK Design Identity**:

- **Primary Colors**: Blue (`#2563EB`) and Cyan (`#06B6D4`)
- **Theme**: Dark mode by default
- **Typography**: Nunito (UI), Shrikhand (Display), JetBrains Mono (Code)
- **Aesthetic**: Tech-forward with AI/ML neural network theme

See [docs/03-design-system.md](docs/03-design-system.md) for full guidelines.

---

## 🤝 Contributing

We welcome contributions! Please follow these steps:

1. Fork the repository
2. Create a feature branch (`git checkout -b feature/amazing-feature`)
3. Commit your changes (`git commit -m 'Add amazing feature'`)
4. Push to the branch (`git push origin feature/amazing-feature`)
5. Open a Pull Request

---

## 📝 License

This project is licensed under the MIT License.

---

## 🙏 Acknowledgments

- **The Noders PTNK** - For the project vision and design identity
- **Supabase** - For the amazing backend platform
- **Vercel** - For seamless deployment
- **Next.js Team** - For the incredible framework

---

## 📧 Contact

For questions or support:

- **GitHub Issues**: [Create an issue](https://github.com/your-org/competition-platform/issues)
- **Email**: support@thenoders.com

---

**Built with ❤️ by The Noders PTNK**
