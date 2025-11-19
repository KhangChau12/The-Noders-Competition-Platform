# Authentication & Authorization System

**Project**: AI Competition Platform
**Organization**: The Noders PTNK
**Version**: 1.0
**Last Updated**: 17/11/2025

---

## 1. Overview

### 1.1 Authentication Strategy
This platform uses **Supabase Auth** for all authentication and authorization needs. Supabase provides secure, built-in features including:

- Email/password authentication with verification
- Session management with JWT tokens
- Row-level security (RLS) for database access
- Built-in password hashing (bcrypt)
- Email verification workflows
- Password reset functionality

### 1.2 Authorization Model
**Role-Based Access Control (RBAC)** with two primary roles:
- `admin`: Full platform control, competition management
- `user`: Standard participant with limited permissions

---

## 2. User Registration Flow

### 2.1 Sign Up Process

```
┌──────────────────────────────────────────────────────────────────┐
│                        SIGN UP FLOW                              │
└──────────────────────────────────────────────────────────────────┘

User visits /signup
    ↓
Enters email + password
    ↓
Client validates:
    - Email format (regex)
    - Password strength (min 8 chars, complexity)
    ↓
Submit to Supabase Auth
    ↓
    ├─→ Error (email exists, weak password)
    │   └─→ Show error message
    │
    └─→ Success
        ↓
        Supabase sends verification email
        ↓
        Show: "Check your email to verify account"
        ↓
        User clicks verification link
        ↓
        Email confirmed → Account active
        ↓
        Redirect to /login or auto-login
```

### 2.2 Email Verification
**Required for all users**. Unverified accounts:
- ❌ Cannot log in
- ❌ Cannot access protected routes
- ❌ Cannot register for competitions

**Verification Email Template** (Customizable in Supabase):
```
Subject: Verify your email for The Noders Competition Platform

Hi there!

Thanks for signing up. Please verify your email address by clicking the link below:

[Verify Email Button]

This link expires in 24 hours.

If you didn't sign up, please ignore this email.

— The Noders PTNK Team
```

### 2.3 Client-Side Validation Rules

```typescript
// Email validation
const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

// Password requirements
const passwordRules = {
  minLength: 8,
  requireUppercase: true,
  requireLowercase: true,
  requireNumber: true,
  requireSpecialChar: false // Optional for v1
};

// Example validation function
function validateSignup(email: string, password: string) {
  const errors: string[] = [];

  if (!emailRegex.test(email)) {
    errors.push("Invalid email format");
  }

  if (password.length < 8) {
    errors.push("Password must be at least 8 characters");
  }

  if (!/[A-Z]/.test(password)) {
    errors.push("Password must contain an uppercase letter");
  }

  if (!/[a-z]/.test(password)) {
    errors.push("Password must contain a lowercase letter");
  }

  if (!/[0-9]/.test(password)) {
    errors.push("Password must contain a number");
  }

  return errors;
}
```

---

## 3. Login Flow

### 3.1 Sign In Process

```
User visits /login
    ↓
Enters email + password
    ↓
Submit to Supabase Auth
    ↓
    ├─→ Error (wrong credentials, unverified email)
    │   └─→ Show appropriate error:
    │       - "Invalid email or password"
    │       - "Please verify your email first"
    │
    └─→ Success
        ↓
        Supabase returns session + JWT
        ↓
        Store session in cookies (httpOnly, secure)
        ↓
        Redirect based on role:
        ├─→ Admin: /admin/dashboard
        └─→ User: /dashboard
```

### 3.2 Session Management

**Token Storage**:
- Use **httpOnly cookies** (secure, not accessible via JavaScript)
- Supabase automatically refreshes tokens before expiration
- Default session lifetime: 7 days

**Session Persistence**:
```typescript
// Supabase client configuration
const supabase = createClient(SUPABASE_URL, SUPABASE_ANON_KEY, {
  auth: {
    autoRefreshToken: true,
    persistSession: true,
    detectSessionInUrl: true // For email verification redirects
  }
});
```

### 3.3 Auto-Login After Verification
When user clicks email verification link:
```
User clicks link → Redirects to /auth/confirm?token=xxx
    ↓
Next.js route handler verifies token
    ↓
    ├─→ Valid token: Auto-login + redirect to /dashboard
    └─→ Invalid/expired: Show error + redirect to /login
```

---

## 4. Password Reset Flow

### 4.1 Forgot Password

```
User clicks "Forgot Password?" on /login
    ↓
Navigates to /forgot-password
    ↓
Enters email address
    ↓
Submit to Supabase Auth (sendPasswordResetEmail)
    ↓
    ├─→ Email not found: Still show success (security best practice)
    └─→ Email found: Send reset link
        ↓
        Show: "Check your email for reset instructions"
```

### 4.2 Reset Password

```
User clicks reset link in email
    ↓
Redirects to /reset-password?token=xxx
    ↓
User enters new password (+ confirm)
    ↓
Validate password strength
    ↓
Submit to Supabase Auth (updateUser)
    ↓
    ├─→ Error (token expired, weak password)
    └─→ Success
        ↓
        Show success message
        ↓
        Auto-login + redirect to /dashboard
```

**Security Notes**:
- Reset tokens expire in 1 hour
- Tokens are single-use (invalidated after reset)
- Old sessions are revoked after password change

---

## 5. Role-Based Access Control (RBAC)

### 5.1 User Roles

| Role | Description | Created How |
|------|-------------|-------------|
| `user` | Default role for all signups | Automatically assigned on registration |
| `admin` | Platform administrator | Manually set via database or seed script |

### 5.2 Role Assignment

**Database Schema** (Supabase `public.users` table):
```sql
CREATE TABLE users (
  id UUID PRIMARY KEY REFERENCES auth.users(id),
  email TEXT NOT NULL,
  role TEXT NOT NULL DEFAULT 'user' CHECK (role IN ('user', 'admin')),
  full_name TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);
```

**Creating Admin Users**:
```sql
-- Option 1: Manual SQL update
UPDATE users SET role = 'admin' WHERE email = 'admin@thenoders.com';

-- Option 2: Seed script (for initial setup)
INSERT INTO users (id, email, role, full_name)
VALUES (
  (SELECT id FROM auth.users WHERE email = 'admin@thenoders.com'),
  'admin@thenoders.com',
  'admin',
  'Admin User'
);
```

### 5.3 Permission Matrix

| Feature | User | Admin |
|---------|------|-------|
| **Authentication** | | |
| Sign up | ✅ | ✅ |
| Sign in | ✅ | ✅ |
| Reset password | ✅ | ✅ |
| **Competition Browsing** | | |
| View public competitions | ✅ | ✅ |
| View competition details | ✅ | ✅ |
| View leaderboards | ✅ | ✅ |
| **Competition Participation** | | |
| Register for competition | ✅ | ❌ (use separate user account) |
| Download datasets | ✅ (if approved) | ✅ (all datasets) |
| Submit solutions | ✅ (if approved) | ❌ |
| View own submissions | ✅ | ✅ (all submissions) |
| **Team Management** | | |
| Create team | ✅ | ✅ |
| Join team | ✅ | ✅ |
| Invite members | ✅ (team leader) | ✅ |
| **Competition Management** | | |
| Create competition | ❌ | ✅ |
| Edit competition | ❌ | ✅ |
| Delete competition | ❌ | ✅ |
| Upload datasets/answer keys | ❌ | ✅ |
| **Registration Management** | | |
| Approve/reject registrations | ❌ | ✅ |
| View all registrations | ❌ | ✅ |
| **Analytics** | | |
| View own stats | ✅ | ✅ |
| View competition analytics | ❌ | ✅ |
| Export data | ❌ | ✅ |

---

## 6. Protected Routes & Middleware

### 6.1 Route Protection Strategy

**Next.js Middleware** (`middleware.ts`):
```typescript
import { createMiddlewareClient } from '@supabase/auth-helpers-nextjs';
import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';

export async function middleware(req: NextRequest) {
  const res = NextResponse.next();
  const supabase = createMiddlewareClient({ req, res });

  const { data: { session } } = await supabase.auth.getSession();

  // Check if route requires authentication
  if (req.nextUrl.pathname.startsWith('/dashboard') ||
      req.nextUrl.pathname.startsWith('/competition/')) {
    if (!session) {
      return NextResponse.redirect(new URL('/login', req.url));
    }
  }

  // Check if route requires admin role
  if (req.nextUrl.pathname.startsWith('/admin')) {
    if (!session) {
      return NextResponse.redirect(new URL('/login', req.url));
    }

    // Fetch user role from database
    const { data: user } = await supabase
      .from('users')
      .select('role')
      .eq('id', session.user.id)
      .single();

    if (user?.role !== 'admin') {
      return NextResponse.redirect(new URL('/dashboard', req.url));
    }
  }

  // Redirect logged-in users away from auth pages
  if ((req.nextUrl.pathname === '/login' ||
       req.nextUrl.pathname === '/signup') && session) {
    const { data: user } = await supabase
      .from('users')
      .select('role')
      .eq('id', session.user.id)
      .single();

    if (user?.role === 'admin') {
      return NextResponse.redirect(new URL('/admin/dashboard', req.url));
    }
    return NextResponse.redirect(new URL('/dashboard', req.url));
  }

  return res;
}

export const config = {
  matcher: [
    '/dashboard/:path*',
    '/competition/:path*',
    '/admin/:path*',
    '/login',
    '/signup'
  ]
};
```

### 6.2 Route Categories

| Route Pattern | Access Level | Redirect If Unauthorized |
|---------------|--------------|--------------------------|
| `/` (home) | Public | — |
| `/login`, `/signup` | Public (redirect if logged in) | `/dashboard` or `/admin/dashboard` |
| `/competitions` (browse) | Public | — |
| `/competition/:id` (details) | Public (limited view) | — |
| `/dashboard` | Authenticated users | `/login` |
| `/competition/:id/submit` | Registered users only | `/login` |
| `/admin/*` | Admin only | `/login` or `/dashboard` |

---

## 7. Database Security (Row-Level Security)

### 7.1 RLS Policies Overview

Supabase Row-Level Security (RLS) enforces access control at the database level. Even if someone bypasses the frontend, they cannot access unauthorized data.

### 7.2 Users Table RLS

```sql
-- Enable RLS
ALTER TABLE users ENABLE ROW LEVEL SECURITY;

-- Policy 1: Users can read their own profile
CREATE POLICY "Users can view own profile"
ON users FOR SELECT
USING (auth.uid() = id);

-- Policy 2: Users can update their own profile (except role)
CREATE POLICY "Users can update own profile"
ON users FOR UPDATE
USING (auth.uid() = id)
WITH CHECK (
  auth.uid() = id AND
  role = (SELECT role FROM users WHERE id = auth.uid()) -- Prevent role escalation
);

-- Policy 3: Admins can view all users
CREATE POLICY "Admins can view all users"
ON users FOR SELECT
USING (
  EXISTS (
    SELECT 1 FROM users
    WHERE users.id = auth.uid() AND users.role = 'admin'
  )
);

-- Policy 4: Admins can update any user (including role)
CREATE POLICY "Admins can update any user"
ON users FOR UPDATE
USING (
  EXISTS (
    SELECT 1 FROM users
    WHERE users.id = auth.uid() AND users.role = 'admin'
  )
);
```

### 7.3 Competitions Table RLS

```sql
ALTER TABLE competitions ENABLE ROW LEVEL SECURITY;

-- Public read access for all competitions
CREATE POLICY "Anyone can view competitions"
ON competitions FOR SELECT
USING (true);

-- Only admins can create
CREATE POLICY "Admins can create competitions"
ON competitions FOR INSERT
WITH CHECK (
  EXISTS (
    SELECT 1 FROM users
    WHERE users.id = auth.uid() AND users.role = 'admin'
  )
);

-- Only admins can update/delete
CREATE POLICY "Admins can update competitions"
ON competitions FOR UPDATE
USING (
  EXISTS (
    SELECT 1 FROM users
    WHERE users.id = auth.uid() AND users.role = 'admin'
  )
);

CREATE POLICY "Admins can delete competitions"
ON competitions FOR DELETE
USING (
  EXISTS (
    SELECT 1 FROM users
    WHERE users.id = auth.uid() AND users.role = 'admin'
  )
);
```

### 7.4 Submissions Table RLS

```sql
ALTER TABLE submissions ENABLE ROW LEVEL SECURITY;

-- Users can view their own submissions
CREATE POLICY "Users can view own submissions"
ON submissions FOR SELECT
USING (
  user_id = auth.uid() OR
  -- Team members can view team submissions
  EXISTS (
    SELECT 1 FROM team_members
    WHERE team_members.user_id = auth.uid()
      AND team_members.team_id = submissions.team_id
  )
);

-- Users can insert their own submissions (if approved)
CREATE POLICY "Approved users can submit"
ON submissions FOR INSERT
WITH CHECK (
  user_id = auth.uid() AND
  EXISTS (
    SELECT 1 FROM registrations
    WHERE registrations.user_id = auth.uid()
      AND registrations.competition_id = submissions.competition_id
      AND registrations.status = 'approved'
  )
);

-- Admins can view all submissions
CREATE POLICY "Admins can view all submissions"
ON submissions FOR SELECT
USING (
  EXISTS (
    SELECT 1 FROM users
    WHERE users.id = auth.uid() AND users.role = 'admin'
  )
);
```

### 7.5 RLS Best Practices

1. **Always enable RLS** on tables with sensitive data
2. **Use `auth.uid()`** to reference the current logged-in user
3. **Test policies** with different user roles
4. **Avoid policy escalation**: Users cannot modify their own role
5. **Combine with app-level checks** for defense in depth

---

## 8. Security Best Practices

### 8.1 Password Security
- ✅ Minimum 8 characters
- ✅ Require uppercase, lowercase, number
- ✅ Hash with bcrypt (automatic via Supabase)
- ✅ No password hints or security questions
- ❌ Never log passwords (even hashed)
- ❌ Never email passwords

### 8.2 Session Security
- ✅ Use httpOnly cookies (prevent XSS)
- ✅ Use secure flag (HTTPS only)
- ✅ Set SameSite attribute (CSRF protection)
- ✅ Auto-refresh tokens before expiration
- ✅ Revoke sessions on password change
- ✅ Implement logout functionality

### 8.3 API Security
- ✅ Always validate user authentication
- ✅ Always check user authorization (role/permissions)
- ✅ Use Supabase RLS for database access
- ✅ Validate and sanitize all inputs
- ✅ Rate limit API endpoints (Supabase Edge Functions)
- ❌ Never trust client-side data

### 8.4 Frontend Security
- ✅ Sanitize user input (prevent XSS)
- ✅ Use Next.js built-in CSRF protection
- ✅ Avoid storing sensitive data in localStorage
- ✅ Implement Content Security Policy (CSP)
- ❌ Never expose API keys in client code
- ❌ Don't rely solely on frontend checks

### 8.5 Email Security
- ✅ Use verified sender domain
- ✅ Include unsubscribe links (for marketing emails)
- ✅ Rate limit verification emails (prevent spam)
- ✅ Expire verification tokens (24 hours)
- ✅ Use secure, random tokens
- ❌ Don't include sensitive data in emails

---

## 9. Implementation Checklist

### 9.1 Supabase Setup
- [ ] Create Supabase project
- [ ] Configure email templates (verification, reset)
- [ ] Set up custom SMTP (optional, for branded emails)
- [ ] Configure allowed redirect URLs
- [ ] Enable email confirmations
- [ ] Set session timeout (default 7 days)

### 9.2 Database Setup
- [ ] Create `users` table with role column
- [ ] Add trigger to sync `auth.users` → `public.users`
- [ ] Implement all RLS policies
- [ ] Create admin user via seed script
- [ ] Test RLS policies with different roles

### 9.3 Frontend Setup
- [ ] Install `@supabase/auth-helpers-nextjs`
- [ ] Configure Supabase client
- [ ] Implement middleware for route protection
- [ ] Create signup page with validation
- [ ] Create login page
- [ ] Create forgot/reset password pages
- [ ] Create email verification confirmation page
- [ ] Add logout functionality

### 9.4 Testing
- [ ] Test signup flow (email verification)
- [ ] Test login flow (correct/incorrect credentials)
- [ ] Test password reset flow
- [ ] Test admin vs user route access
- [ ] Test RLS policies (try unauthorized access)
- [ ] Test session persistence (refresh page)
- [ ] Test logout functionality
- [ ] Test email verification expiry

---

## 10. Common Authentication Patterns

### 10.1 Check If User Is Authenticated (Server Component)

```typescript
// app/dashboard/page.tsx
import { createServerComponentClient } from '@supabase/auth-helpers-nextjs';
import { cookies } from 'next/headers';
import { redirect } from 'next/navigation';

export default async function Dashboard() {
  const supabase = createServerComponentClient({ cookies });

  const { data: { session } } = await supabase.auth.getSession();

  if (!session) {
    redirect('/login');
  }

  return <div>Welcome, {session.user.email}!</div>;
}
```

### 10.2 Check User Role (Server Component)

```typescript
import { createServerComponentClient } from '@supabase/auth-helpers-nextjs';
import { cookies } from 'next/headers';
import { redirect } from 'next/navigation';

export default async function AdminDashboard() {
  const supabase = createServerComponentClient({ cookies });

  const { data: { session } } = await supabase.auth.getSession();

  if (!session) {
    redirect('/login');
  }

  const { data: user } = await supabase
    .from('users')
    .select('role')
    .eq('id', session.user.id)
    .single();

  if (user?.role !== 'admin') {
    redirect('/dashboard');
  }

  return <div>Admin Dashboard</div>;
}
```

### 10.3 Client-Side Auth Context (React Context)

```typescript
// contexts/AuthContext.tsx
'use client';

import { createContext, useContext, useEffect, useState } from 'react';
import { createClientComponentClient } from '@supabase/auth-helpers-nextjs';
import { Session, User } from '@supabase/supabase-js';

type AuthContextType = {
  session: Session | null;
  user: User | null;
  userRole: string | null;
  signOut: () => Promise<void>;
};

const AuthContext = createContext<AuthContextType>({
  session: null,
  user: null,
  userRole: null,
  signOut: async () => {}
});

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [session, setSession] = useState<Session | null>(null);
  const [userRole, setUserRole] = useState<string | null>(null);
  const supabase = createClientComponentClient();

  useEffect(() => {
    // Get initial session
    supabase.auth.getSession().then(({ data: { session } }) => {
      setSession(session);
      if (session) {
        fetchUserRole(session.user.id);
      }
    });

    // Listen for auth changes
    const { data: { subscription } } = supabase.auth.onAuthStateChange(
      (_event, session) => {
        setSession(session);
        if (session) {
          fetchUserRole(session.user.id);
        } else {
          setUserRole(null);
        }
      }
    );

    return () => subscription.unsubscribe();
  }, []);

  async function fetchUserRole(userId: string) {
    const { data } = await supabase
      .from('users')
      .select('role')
      .eq('id', userId)
      .single();
    setUserRole(data?.role || null);
  }

  async function signOut() {
    await supabase.auth.signOut();
    setSession(null);
    setUserRole(null);
  }

  return (
    <AuthContext.Provider value={{
      session,
      user: session?.user || null,
      userRole,
      signOut
    }}>
      {children}
    </AuthContext.Provider>
  );
}

export const useAuth = () => useContext(AuthContext);
```

### 10.4 Sign Up Function

```typescript
// app/signup/actions.ts
'use server';

import { createServerActionClient } from '@supabase/auth-helpers-nextjs';
import { cookies } from 'next/headers';

export async function signUp(formData: FormData) {
  const email = formData.get('email') as string;
  const password = formData.get('password') as string;
  const fullName = formData.get('fullName') as string;

  const supabase = createServerActionClient({ cookies });

  const { data, error } = await supabase.auth.signUp({
    email,
    password,
    options: {
      emailRedirectTo: `${process.env.NEXT_PUBLIC_SITE_URL}/auth/callback`,
      data: {
        full_name: fullName
      }
    }
  });

  if (error) {
    return { error: error.message };
  }

  return { success: true, message: 'Check your email to verify your account' };
}
```

### 10.5 Sign In Function

```typescript
// app/login/actions.ts
'use server';

import { createServerActionClient } from '@supabase/auth-helpers-nextjs';
import { cookies } from 'next/headers';
import { redirect } from 'next/navigation';

export async function signIn(formData: FormData) {
  const email = formData.get('email') as string;
  const password = formData.get('password') as string;

  const supabase = createServerActionClient({ cookies });

  const { data, error } = await supabase.auth.signInWithPassword({
    email,
    password
  });

  if (error) {
    return { error: error.message };
  }

  // Fetch user role to determine redirect
  const { data: user } = await supabase
    .from('users')
    .select('role')
    .eq('id', data.user.id)
    .single();

  if (user?.role === 'admin') {
    redirect('/admin/dashboard');
  } else {
    redirect('/dashboard');
  }
}
```

---

## 11. Error Handling

### 11.1 Authentication Error Messages

Map Supabase errors to user-friendly messages:

```typescript
function getAuthErrorMessage(error: string): string {
  const errorMap: Record<string, string> = {
    'Invalid login credentials': 'Invalid email or password',
    'Email not confirmed': 'Please verify your email before logging in',
    'User already registered': 'An account with this email already exists',
    'Password should be at least 8 characters': 'Password must be at least 8 characters long',
    'Signups not allowed for this instance': 'Registration is currently disabled',
    'Email rate limit exceeded': 'Too many requests. Please try again later',
  };

  return errorMap[error] || 'An error occurred. Please try again.';
}
```

### 11.2 Display Errors in UI

```typescript
// Example: Login form
'use client';

import { useState } from 'react';
import { signIn } from './actions';

export default function LoginForm() {
  const [error, setError] = useState<string | null>(null);

  async function handleSubmit(formData: FormData) {
    const result = await signIn(formData);
    if (result?.error) {
      setError(getAuthErrorMessage(result.error));
    }
  }

  return (
    <form action={handleSubmit}>
      {error && (
        <div className="bg-red-500/10 border border-red-500 text-red-500 px-4 py-3 rounded">
          {error}
        </div>
      )}

      <input type="email" name="email" required />
      <input type="password" name="password" required />
      <button type="submit">Sign In</button>
    </form>
  );
}
```

---

## 12. Testing Authentication

### 12.1 Manual Test Cases

| Test Case | Steps | Expected Result |
|-----------|-------|-----------------|
| Sign up with valid data | Enter email, password → Submit | Verification email sent, success message |
| Sign up with existing email | Use registered email → Submit | Error: "Email already exists" |
| Sign up with weak password | Use "pass123" → Submit | Error: "Password requirements not met" |
| Verify email | Click link in verification email | Auto-login, redirect to dashboard |
| Login with correct credentials | Enter email, password → Submit | Redirect to dashboard (or admin dashboard) |
| Login with wrong password | Enter email, wrong password → Submit | Error: "Invalid email or password" |
| Login with unverified email | Login before verifying → Submit | Error: "Please verify your email" |
| Forgot password | Enter email → Submit | Reset email sent, success message |
| Reset password | Click reset link, enter new password → Submit | Password updated, auto-login |
| Access /admin as user | Login as user, navigate to /admin | Redirect to /dashboard |
| Access /dashboard as admin | Login as admin, navigate to /dashboard | Allow access (admins can view user pages) |
| Access protected route logged out | Navigate to /dashboard without login | Redirect to /login |
| Logout | Click logout button | Session cleared, redirect to home |

### 12.2 Automated Tests (Jest + React Testing Library)

```typescript
// __tests__/auth/signup.test.tsx
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import SignupPage from '@/app/signup/page';

describe('Signup Page', () => {
  it('shows validation errors for invalid email', async () => {
    render(<SignupPage />);

    const emailInput = screen.getByLabelText(/email/i);
    const submitButton = screen.getByRole('button', { name: /sign up/i });

    fireEvent.change(emailInput, { target: { value: 'invalid-email' } });
    fireEvent.click(submitButton);

    await waitFor(() => {
      expect(screen.getByText(/invalid email format/i)).toBeInTheDocument();
    });
  });

  it('shows validation errors for weak password', async () => {
    render(<SignupPage />);

    const passwordInput = screen.getByLabelText(/password/i);
    const submitButton = screen.getByRole('button', { name: /sign up/i });

    fireEvent.change(passwordInput, { target: { value: 'weak' } });
    fireEvent.click(submitButton);

    await waitFor(() => {
      expect(screen.getByText(/password must be at least 8 characters/i)).toBeInTheDocument();
    });
  });
});
```

---

## 13. Troubleshooting Common Issues

| Issue | Possible Cause | Solution |
|-------|----------------|----------|
| Email verification not arriving | SMTP not configured, spam folder | Check Supabase email settings, check spam folder |
| "Invalid refresh token" error | Session expired, cookies blocked | Clear cookies, login again, check browser settings |
| Infinite redirect loop | Middleware misconfiguration | Check middleware logic, ensure proper session checks |
| RLS policy blocking insert | Missing or incorrect policy | Review RLS policies, check `auth.uid()` usage |
| Admin can't create competition | RLS policy too restrictive | Verify admin role policy, check user.role column |
| User can see other users' data | Missing RLS policy | Add policy to restrict SELECT to own data |

---

## Appendix A: Database Trigger for User Sync

Automatically create a `public.users` row when a user signs up:

```sql
-- Function to sync auth.users to public.users
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER AS $$
BEGIN
  INSERT INTO public.users (id, email, role, full_name)
  VALUES (
    NEW.id,
    NEW.email,
    'user', -- Default role
    NEW.raw_user_meta_data->>'full_name'
  );
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Trigger on auth.users insert
CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();
```

---

## Appendix B: Environment Variables

Required environment variables for authentication:

```env
# Supabase
NEXT_PUBLIC_SUPABASE_URL=https://your-project.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=your-anon-key
SUPABASE_SERVICE_ROLE_KEY=your-service-role-key

# Site URL (for email redirects)
NEXT_PUBLIC_SITE_URL=https://yoursite.com

# Optional: Custom SMTP (if not using Supabase default)
SMTP_HOST=smtp.gmail.com
SMTP_PORT=587
SMTP_USER=your-email@gmail.com
SMTP_PASS=your-app-password
```

---

## Appendix C: Email Templates (Supabase Dashboard)

**Verification Email**:
```html
<h2>Confirm your email</h2>
<p>Follow this link to confirm your email:</p>
<p><a href="{{ .ConfirmationURL }}">Confirm Email</a></p>
```

**Password Reset Email**:
```html
<h2>Reset your password</h2>
<p>Follow this link to reset your password:</p>
<p><a href="{{ .ConfirmationURL }}">Reset Password</a></p>
<p>If you didn't request this, please ignore this email.</p>
```

---

**Document Status**: ✅ Ready for Implementation
**Next Steps**: Proceed to [03-design-system.md](03-design-system.md)
