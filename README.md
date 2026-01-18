# The Noders Competition Platform

A web platform for hosting AI/Machine Learning competitions with automated CSV grading and real-time leaderboards.

## Features

### For Participants
- Account registration with email verification
- Browse and register for competitions
- Create and manage teams (for team competitions)
- CSV submission with drag & drop
- Real-time leaderboards (public/private)
- Submission history and score tracking
- Countdown timers for competition phases

### For Admins
- Create and configure competitions (3 or 4 phases)
- Approve participant/team registrations
- Upload answer keys for automated grading
- Analytics dashboard (participants, submissions, etc.)
- Manage submission limits (daily/total)

### Competition Types
- **3-Phase**: Registration → Public Test → Ended
- **4-Phase**: Registration → Public Test → Private Test → Ended
- Individual or team-based participation
- Automated scoring with F1-score
- Ranking by highest score, tie-break by earliest submission

## Tech Stack

- **Frontend**: Next.js 14 (App Router), TypeScript, Tailwind CSS
- **Backend**: Supabase (PostgreSQL, Auth, Storage, Edge Functions)
- **Deployment**: Vercel + Supabase Cloud
