# The Noders Competition Platform

A web platform for hosting AI/Machine Learning competitions with automated CSV grading and real-time leaderboards.

## Features

### For Participants
- Account registration with email verification
- Browse and register for competitions
- **Practice Problems** — solve permanent, deadline-free ML problems to sharpen skills
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
- **Create and manage practice problems** with custom tags and difficulty levels
- **Configure practice problem scoring** (F1-score, accuracy, MAE, RMSE, etc.)
- **Monitor practice submissions** and global leaderboards

### Competition Types
- **3-Phase**: Registration → Public Test → Ended
- **4-Phase**: Registration → Public Test → Private Test → Ended
- Individual or team-based participation
- Automated scoring with F1-score
- Ranking by highest score, tie-break by earliest submission

### Practice Problems
- **No deadline** — access 24/7, solve at your own pace
- **Flexible categories** — problems tagged by domain (e.g., CV Classification, NLP Regression, etc.)
- **Automated scoring** — submit CSV predictions, get instant feedback on accuracy
- **Global leaderboard** — compete with other users on each problem
- **No registration required** — logged-in users can submit anytime
- **Submission tracking** — view all your submissions and best scores for each problem
- **Difficulty levels** — beginner, intermediate, and advanced problems
- Unlimited or quota-based submissions (configurable per problem)

## Tech Stack

- **Frontend**: Next.js 14 (App Router), TypeScript, Tailwind CSS
- **Backend**: Supabase (PostgreSQL, Auth, Storage, Edge Functions)
- **Deployment**: Vercel + Supabase Cloud
