# Project Requirements & Specifications

**Project**: AI Competition Platform
**Organization**: The Noders PTNK
**Version**: 1.0
**Last Updated**: 17/11/2025

---

## 1. Executive Summary

### 1.1 Project Overview
A web-based platform for organizing AI/Machine Learning competitions with automated CSV submission grading and real-time leaderboard tracking.

### 1.2 Core Purpose
- Host competitive AI/ML challenges with structured phases
- Automate submission validation and F1 score calculation
- Provide transparent leaderboard and analytics
- Support both individual and team-based competitions

### 1.3 Target Users
- **Administrators**: Competition organizers, judges, analytics viewers
- **Participants**: Students, data scientists, ML practitioners
- **Public**: Anonymous viewers of competition details and leaderboards

---

## 2. Technology Stack

### 2.1 Frontend
- **Framework**: Next.js (App Router)
- **Language**: TypeScript/TSX
- **Styling**: Tailwind CSS
- **UI Components**: Custom component library following The Noders design system
- **Data Visualization**: Recharts or Visx
- **CSV Parsing**: Papa Parse
- **Deployment**: Vercel

### 2.2 Backend
- **BaaS**: Supabase
- **Database**: PostgreSQL (via Supabase)
- **Authentication**: Supabase Auth (email verification)
- **Storage**: Supabase Storage (submission files, answer keys)
- **Serverless Functions**: Supabase Edge Functions
- **File Processing**: Server-side CSV validation and scoring

### 2.3 Key Libraries
```json
{
  "frontend": [
    "next",
    "react",
    "typescript",
    "tailwindcss",
    "recharts",
    "papaparse",
    "@supabase/supabase-js"
  ],
  "backend": [
    "supabase",
    "deno (edge functions)"
  ]
}
```

---

## 3. Core Features Scope

### 3.1 Version 1.0 - INCLUDED Features

#### User Management
- ✅ Email-based registration with verification
- ✅ Admin and User role separation
- ✅ User profile management
- ✅ Team creation and management
- ✅ Registration approval system

#### Competition Management
- ✅ Create competitions with full configuration
- ✅ Two competition types (3-phase and 4-phase)
- ✅ Automatic phase transitions based on schedule
- ✅ Public/Private test datasets
- ✅ Submission quota management (daily + total)
- ✅ Individual and Team competition modes

#### Submission System
- ✅ CSV file upload and validation
- ✅ Automated F1 score calculation
- ✅ Submission history tracking
- ✅ Best score selection logic
- ✅ Validation error reporting (doesn't count toward quota)

#### Leaderboard
- ✅ Public and Private leaderboards
- ✅ Best score ranking
- ✅ Tie-breaking by earliest submission time
- ✅ Team and Individual leaderboards
- ✅ Manual refresh mechanism (no real-time updates)

#### Analytics & Insights
- ✅ Admin analytics dashboard
- ✅ Submission timeline charts
- ✅ Score distribution analysis
- ✅ User engagement metrics
- ✅ Validation error tracking
- ✅ Data export (CSV)

#### Public Pages
- ✅ Landing page for anonymous users
- ✅ Browse competitions (filter/search)
- ✅ View competition details (read-only)
- ✅ View public leaderboards

### 3.2 Version 1.0 - EXCLUDED Features (Future)
- ❌ Real-time leaderboard updates
- ❌ Discussion forum/comments
- ❌ Code execution environments
- ❌ Jupyter notebook integration
- ❌ API-based submissions
- ❌ Multiple scoring metrics (only F1 in v1)
- ❌ Competition cloning/templates
- ❌ Email notifications
- ❌ Social sharing features
- ❌ Payment/prize management

---

## 4. User Roles & Permissions

### 4.1 Admin Role
**Capabilities**:
- Create, edit, delete competitions
- Upload datasets and answer keys
- Approve/reject user registrations
- Approve/reject team registrations
- View all submissions
- Access analytics dashboard
- Export data (leaderboards, submissions, analytics)
- Modify competition timelines (with warnings)

**Restrictions**:
- Cannot participate in competitions as admin
- Must use separate user account to compete

### 4.2 User Role
**Capabilities**:
- Register for competitions (individual or team)
- Create teams and invite members
- Join existing teams
- Download competition datasets (after approval)
- Submit CSV solutions
- View submission history
- View leaderboards
- View competition details

**Restrictions**:
- Cannot modify competition settings
- Cannot view other users' submissions
- Cannot access analytics dashboard
- Submission quota limits apply

### 4.3 Public (Unauthenticated)
**Capabilities**:
- View landing page
- Browse competition list
- View competition details (limited)
- View public leaderboards

**Restrictions**:
- Cannot register for competitions
- Cannot download datasets
- Cannot submit solutions
- Cannot view private information

---

## 5. Competition Types & Phases

### 5.1 Type 1: 4-Phase Competition

```
┌─────────────────┐     ┌─────────────────┐     ┌─────────────────┐     ┌─────────────────┐
│  REGISTRATION   │ --> │   PUBLIC TEST   │ --> │  PRIVATE TEST   │ --> │     ENDED       │
└─────────────────┘     └─────────────────┘     └─────────────────┘     └─────────────────┘
   Accept signups      Submit to public       Submit to private      Show final results
   Form teams          View public LB         Private LB hidden      Both LBs visible
```

**Use case**: Traditional ML competitions (e.g., Kaggle-style)

### 5.2 Type 2: 3-Phase Competition

```
┌─────────────────┐     ┌─────────────────┐     ┌─────────────────┐
│  REGISTRATION   │ --> │      TEST       │ --> │     ENDED       │
└─────────────────┘     └─────────────────┘     └─────────────────┘
   Accept signups      Submit solutions       Show final results
   Form teams          View leaderboard       Leaderboard locked
```

**Use case**: Shorter competitions, hackathons, workshops

### 5.3 Phase Transition Rules
- **Automatic**: Phases change based on configured timestamps
- **No manual override** during transition
- **Queued submissions**: If submitted during phase change, process in new phase
- **Timeline modification**: Admin can adjust (with warning if competition started)

---

## 6. Submission & Scoring System

### 6.1 File Format Specification

**Required CSV Format**:
```csv
id,Overall
1393,8
1394,9
1395,6
```

**Rules**:
- Exactly 2 columns (ID + prediction)
- Column 1: Must be named "id" (case-insensitive)
- Column 2: Name doesn't matter, contains predicted values
- No missing values
- No duplicate IDs

### 6.2 Validation Pipeline

```
Upload CSV
    ↓
Format Check (is CSV?)
    ↓
Size Check (< 10MB?)
    ↓
Structure Check (2 columns?)
    ↓
Row Count Match (equals answer key?)
    ↓
ID Validation (all IDs present?)
    ↓
Duplicate Check (no duplicate IDs?)
    ↓
    → FAIL: Return error, DON'T count submission
    → PASS: Calculate score, count submission
```

### 6.3 Scoring Algorithm

**Metric**: F1 Score (macro-averaged for multi-class)

**Formula**:
```
Precision = TP / (TP + FP)
Recall = TP / (TP + FN)
F1 = 2 × (Precision × Recall) / (Precision + Recall)
```

**Implementation Notes**:
- Match predictions to ground truth by ID
- Handle multi-class classification
- Return score rounded to 4 decimal places
- Store raw score in database (don't round in DB)

### 6.4 Submission Quota Management

**Daily Quota**:
- Reset at midnight UTC (configurable)
- Example: 5 submissions per day

**Total Quota**:
- Lifetime limit per competition
- Example: 50 submissions total

**Team Mode**:
- Quota shared across all team members
- Any member's submission counts toward team quota
- Example: Team of 3, limit 5/day → still 5/day total (not 15)

**Validation Failures**:
- Do NOT count toward quota
- User can resubmit immediately

---

## 7. Leaderboard Logic

### 7.1 Scoring Rules
- **Best Score Selection**: Only the highest score from each user/team is shown
- **Tie-breaking**: Earlier submission time wins
- **Separate Leaderboards**: Public and Private phases have independent rankings

### 7.2 Display Modes

**Individual Competition**:
```
Rank | User          | Best Score | Submissions | Last Submit
-----|---------------|------------|-------------|-------------
1    | user123       | 0.9234     | 12          | 2h ago
2    | ml_master     | 0.9156     | 8           | 5h ago
```

**Team Competition**:
```
PRIMARY: Team Leaderboard
Rank | Team Name     | Best Score | Submissions | Members
-----|---------------|------------|-------------|--------
1    | AI Dragons    | 0.9234     | 12          | 3
2    | ML Warriors   | 0.9156     | 8           | 2

SECONDARY: Personal Contribution
User          | Team          | Submissions | Best Personal
--------------|---------------|-------------|---------------
user_a        | AI Dragons    | 7           | 0.9234
user_b        | AI Dragons    | 5           | 0.8923
```

### 7.3 Visibility Rules
- **Public Phase**: Public leaderboard visible during and after phase
- **Private Phase**: Private leaderboard ONLY visible after competition ends
- **After Competition**: Both leaderboards visible to all

### 7.4 Refresh Mechanism
- **No real-time updates** (avoids server overload)
- Initial load on page visit
- Manual "Refresh" button for user-triggered updates
- Auto-refresh every 5 minutes (optional)

---

## 8. Team Management

### 8.1 Team Creation
```
User creates team
    → Becomes team leader
    → Can invite members (via email or username)
    → Can remove members
    → Can disband team (if not in active competition)
```

### 8.2 Team Joining
```
User receives invitation
    → Accepts/Declines
    → Can leave team (if not locked)
    → Cannot join multiple teams simultaneously
```

### 8.3 Team Registration for Competition
```
Team leader registers team
    → All members auto-included
    → Admin approves TEAM (not individual members)
    → Upon approval: All members can submit
```

### 8.4 Team Locking Rules
- **After registration approval**: Team roster locked
- **Cannot add/remove members** during active competition
- **Cannot leave team** until competition ends
- **Reason**: Prevents gaming the system

---

## 9. Admin Dashboard Requirements

### 9.1 Competition Management
- **Create Competition Form**: All fields from section 3 (idea.txt)
- **Edit Competition**: Modify settings (warn if competition started)
- **Delete Competition**: Soft delete with confirmation
- **Competition List**: Filter by status, search by name

### 9.2 Registration Management
```
Pending Registrations
├── Individual: List with Approve/Reject buttons
└── Team: List with member details, Approve/Reject buttons

Approved Registrations
├── View list
└── Revoke access (with confirmation)
```

### 9.3 Analytics Dashboard (Critical Feature)

**Overview Cards**:
- Total registrations
- Approved participants
- Total submissions
- Avg submissions per participant

**Charts**:
1. **Submission Timeline**: Line chart (submissions over time)
2. **Score Distribution**: Histogram (distribution of best scores)
3. **Engagement Funnel**: Registered → Submitted → Active
4. **Top Performers**: Bar chart (top 10 scores)

**Detailed Tables**:
- User engagement (registrations, submissions, last active)
- Validation errors (type, frequency, over time)
- Submission frequency (hourly heatmap)

**Insights** (text summaries):
- "Peak submission time: 8-10 PM"
- "Top 10% threshold: 0.89 F1 score"
- "Most common error: Row count mismatch (35%)"

### 9.4 Data Export
- Export leaderboard (CSV)
- Export all submissions with metadata (CSV)
- Export analytics report (PDF or CSV)

---

## 10. User Interface Requirements

### 10.1 Public Pages (Unauthenticated)

#### Landing Page
- Hero section (platform introduction)
- Featured competitions
- How it works (3-step process)
- Call-to-action (Sign Up / Login)
- Footer (links, contact)

#### Competition Browse
- Card grid or table view
- Filters: Status (All/Registering/Ongoing/Ended)
- Search by name
- Sort by: Latest, Ending soon, Most participants
- Click to view details

#### Competition Detail (Read-Only)
- Competition name and description
- Current phase indicator
- Countdown timer
- Leaderboard (public only)
- Rules and timeline
- CTA: "Sign up to participate"

### 10.2 User Pages (Authenticated)

#### Dashboard/Home
- My Competitions (registered, ongoing, past)
- My Teams
- Recommended competitions
- Quick stats (submissions, rank)

#### Competition Browse
- Same as public, but with registration status badges:
  - "Not Registered" → Register button
  - "Pending Approval" → Yellow badge
  - "Registered" → Green badge + Enter button

#### Competition Detail (Registered User)
```
Tabs:
├── Overview: Description, timeline, rules
├── Leaderboard: Rankings (refresh button)
├── Submit: Upload CSV form + quota display
├── My Submissions: History table with scores
└── Dataset: Download links
```

**Key UI Elements**:
- **Countdown Timer**: Large, prominent
- **Phase Indicator**: Badge showing current phase
- **Quota Display**:
  ```
  Submissions Today: 3 / 5
  Total Submissions: 12 / 50
  ```
- **Submit Form**:
  - File upload (drag & drop)
  - Validation errors display
  - Submit button (disabled if quota exceeded)
- **Submission History**:
  ```
  # | Time       | Phase   | Score  | Status
  --|------------|---------|--------|--------
  5 | 2h ago     | Public  | 0.8532 | Best ⭐
  4 | 5h ago     | Public  | 0.8421 | —
  ```

### 10.3 Admin Pages

#### Admin Dashboard
- Overview metrics (all competitions)
- Pending registrations (action required)
- Recent submissions
- Quick actions (Create competition)

#### Competition Management
- List all competitions (table)
- Create/Edit/Delete buttons
- View registrations
- View analytics (deep dive)

#### Analytics Page
- See section 9.3 for detailed requirements
- Interactive charts
- Filter by date range
- Export buttons

---

## 11. Edge Cases & Business Rules

### 11.1 Team Management Edge Cases

| Scenario | Rule |
|----------|------|
| User wants to leave team during competition | ❌ NOT ALLOWED (team locked) |
| Team leader wants to disband team | ✅ Allowed if no active competitions |
| User kicked from team after registration | ❌ NOT ALLOWED (team locked) |
| Team member submits with 0 quota left | ❌ Blocked with error message |

### 11.2 Submission Edge Cases

| Scenario | Rule |
|----------|------|
| Submit during phase transition | Queue and process in new phase |
| Submit file with extra IDs | ✅ Accept, ignore extra IDs |
| Submit file with missing IDs | ❌ Reject, don't count submission |
| Submit with duplicate IDs | ❌ Reject, don't count submission |
| Validation fails | ❌ Show error, DON'T count toward quota |

### 11.3 Competition Management Edge Cases

| Scenario | Rule |
|----------|------|
| Admin changes timeline after competition started | ✅ Allow with warning modal |
| Admin deletes competition with submissions | ✅ Soft delete, keep data |
| Admin uploads wrong answer key | ❌ Validate before saving (require confirmation) |
| Competition has no registrations | ✅ Still runs, shows empty leaderboard |

### 11.4 Leaderboard Edge Cases

| Scenario | Rule |
|----------|------|
| Two users same score, same time | Use user ID (ascending) as tiebreaker |
| User submits during Private phase | Private leaderboard updates, hidden until end |
| Team member leaves before competition ends | ❌ Not allowed (team locked) |

---

## 12. Non-Functional Requirements

### 12.1 Performance
- **Page Load**: < 3 seconds (FCP)
- **Submission Processing**: < 5 seconds for 10k rows
- **Leaderboard Query**: < 2 seconds for 1000 users
- **Database Queries**: Optimized with indexes
- **File Upload**: Support up to 10 MB

### 12.2 Security
- **Authentication**: Supabase Auth (email verification required)
- **Authorization**: Row-level security (RLS) in Supabase
- **File Upload**: Validate file type, size, content
- **SQL Injection**: Parameterized queries only
- **XSS**: Sanitize all user input
- **CSRF**: Next.js built-in protection
- **Data Privacy**: Users cannot view others' submissions

### 12.3 Scalability
- **Concurrent Users**: Support 500+ simultaneous users
- **Competitions**: Support 50+ active competitions
- **Submissions**: Handle 10k+ submissions per competition
- **Storage**: Efficient file storage in Supabase Storage

### 12.4 Reliability
- **Uptime**: 99% availability (Vercel + Supabase SLA)
- **Data Backup**: Automatic Supabase backups
- **Error Handling**: Graceful error messages (no stack traces to users)
- **Logging**: Server-side error logging for debugging

### 12.5 Accessibility
- **WCAG 2.1 Level AA**: Minimum compliance
- **Keyboard Navigation**: Full support
- **Screen Readers**: Semantic HTML + ARIA labels
- **Color Contrast**: Minimum 4.5:1 ratio

### 12.6 Browser Support
- **Modern Browsers**: Chrome, Firefox, Safari, Edge (last 2 versions)
- **Mobile**: Responsive design (iOS Safari, Chrome Android)
- **No IE11 Support**

---

## 13. Success Metrics

### 13.1 Launch Criteria (MVP)
- ✅ 2 admin accounts created
- ✅ 10 test users registered
- ✅ 1 sample competition completed end-to-end
- ✅ All core features functional
- ✅ No critical bugs
- ✅ Responsive design tested (mobile + desktop)

### 13.2 Post-Launch Metrics
- **User Adoption**: 50+ registered users in first month
- **Competition Activity**: 3+ competitions hosted
- **Submission Volume**: 100+ submissions processed
- **User Retention**: 40% users return for 2nd competition
- **Platform Reliability**: < 5 critical bugs in first month

---

## 14. Future Considerations (Post v1.0)

### Phase 2 Features (Priority)
- Email notifications (registration approval, phase transitions)
- Real-time leaderboard with WebSocket
- Discussion forum per competition
- Competition templates/cloning
- Multiple scoring metrics (RMSE, Accuracy, AUC)

### Phase 3 Features (Nice-to-Have)
- API-based submissions
- Jupyter notebook integration
- Team chat functionality
- Social sharing (LinkedIn, Twitter)
- Prize/reward management
- Advanced analytics (ML model insights)

### Technical Debt to Address
- Add comprehensive test suite (unit + integration)
- Implement CI/CD pipeline
- Set up monitoring and alerting
- Create admin API documentation
- Build mobile app (React Native)

---

## 15. Constraints & Assumptions

### 15.1 Constraints
- **Budget**: Free tier Supabase + Vercel (scale later)
- **Timeline**: MVP in 4-6 weeks
- **Team Size**: 2-4 developers
- **Expertise**: Familiarity with Next.js + TypeScript required

### 15.2 Assumptions
- Users have basic understanding of ML/AI
- Users can prepare CSV files themselves
- Internet connection required (no offline mode)
- English as primary language (i18n in future)
- Users have modern browsers

### 15.3 Dependencies
- Supabase service availability
- Vercel deployment platform
- Google Fonts CDN
- Third-party libraries (npm packages)

---

## Appendix A: Glossary

| Term | Definition |
|------|------------|
| **Competition** | An AI/ML challenge with defined timeline and dataset |
| **Submission** | A CSV file uploaded by user containing predictions |
| **Leaderboard** | Ranked list of participants by score |
| **Phase** | A time period in competition (Registration, Public Test, Private Test, Ended) |
| **Quota** | Maximum allowed submissions (daily or total) |
| **F1 Score** | Harmonic mean of precision and recall |
| **Answer Key** | Ground truth labels uploaded by admin |
| **Validation** | Checking CSV format and content before scoring |
| **Best Score** | Highest score achieved by user/team (used for ranking) |

---

## Appendix B: References

- F1 Score Formula: [Wikipedia - F-score](https://en.wikipedia.org/wiki/F-score)
- Supabase Docs: [https://supabase.com/docs](https://supabase.com/docs)
- Next.js Docs: [https://nextjs.org/docs](https://nextjs.org/docs)
- WCAG 2.1: [https://www.w3.org/WAI/WCAG21/quickref/](https://www.w3.org/WAI/WCAG21/quickref/)
- The Noders PTNK Design Identity: See [03-design-system.md](03-design-system.md)

---

**Document Status**: ✅ Approved for Development
**Next Steps**: Proceed to [02-authentication-system.md](02-authentication-system.md)
