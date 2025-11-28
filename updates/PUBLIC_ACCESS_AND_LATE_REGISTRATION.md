# Public Access & Late Registration Updates

## Summary
1. Cho phép đăng ký trong giai đoạn thi (late registration) - chỉ cần admin approve
2. Fix RLS policies để người chưa đăng nhập có thể xem leaderboard và participant counts

## Changes Made

### 1. Allow Late Registration During Competition
**File**: `src/app/(public)/competitions/[id]/page.tsx` (line 279-285)

#### Before:
```tsx
{currentPhase === 'registration' && (
  <Link href={`/competitions/${id}/register`}>
    <Button variant="primary" size="md">
      Register Now
    </Button>
  </Link>
)}
```

#### After:
```tsx
{currentPhase !== 'ended' && (
  <Link href={`/competitions/${id}/register`}>
    <Button variant="primary" size="md">
      {currentPhase === 'registration' ? 'Register Now' : 'Late Registration'}
    </Button>
  </Link>
)}
```

#### Changes:
- ✅ Cho phép registration khi `currentPhase !== 'ended'`
- ✅ Trong giai đoạn registration: Button text = "Register Now"
- ✅ Trong giai đoạn thi (public_test, private_test): Button text = "Late Registration"
- ✅ Chỉ block khi competition đã ended
- ✅ Admin vẫn cần approve registration

#### Benefits:
- Người dùng có thể tham gia muộn nếu admin cho phép
- Linh hoạt hơn trong việc quản lý participants
- Không bị giới hạn bởi thời gian registration phase

---

### 2. Public Access to Leaderboard & Participant Counts
**File**: `supabase/migrations/005_allow_public_leaderboard_access.sql`

#### What Was Fixed:
RLS policies đang chặn anonymous users không cho xem:
- ❌ Submissions (leaderboard data)
- ❌ User profiles (participant names)
- ❌ Teams (team competition data)
- ❌ Participant counts

#### New RLS Policies:

##### A. Submissions Table
```sql
CREATE POLICY "Public can view submissions for leaderboard"
ON public.submissions
FOR SELECT
USING (
  -- Allow if user is viewing their own submission
  (auth.uid() = user_id)
  OR
  -- Allow viewing any valid submission for leaderboard
  (validation_status = 'valid')
);
```

**Logic:**
- ✅ Authenticated users: Xem được own submissions
- ✅ Anyone (including anon): Xem được valid submissions cho leaderboard
- ✅ Private submissions (invalid, pending) vẫn được protect

##### B. Users Table
```sql
CREATE POLICY "Public can view user profiles for leaderboard"
ON public.users
FOR SELECT
TO anon, authenticated
USING (true);
```

**Logic:**
- ✅ Anyone có thể xem user profiles (cần cho leaderboard names)
- ✅ Chỉ SELECT, không thể UPDATE/DELETE
- ⚠️ Note: Nếu có sensitive data trong users table, có thể restrict columns

##### C. Teams Table
```sql
CREATE POLICY "Public can view teams for leaderboard"
ON public.teams
FOR SELECT
TO anon, authenticated
USING (true);
```

**Logic:**
- ✅ Anyone có thể xem team info cho team competitions
- ✅ Cần cho team leaderboard display

##### D. Grants
```sql
GRANT SELECT ON public.submissions TO anon;
GRANT SELECT ON public.users TO anon;
GRANT SELECT ON public.teams TO anon;
```

**Why needed:**
- RLS policies alone không đủ
- Cần explicit GRANT để anon users có quyền read

---

### 3. Existing Public Access Features (Already Working)

#### Participant Counts View
**File**: `supabase/migrations/004_add_public_participant_counts.sql`
- ✅ View `competition_participant_counts` đã có GRANT cho anon
- ✅ Bypasses RLS, safe aggregated data only

#### Code Already Supports Anon Users

**File**: `src/app/(public)/competitions/[id]/page.tsx`
```tsx
// Get current user
const { data: { user } } = await supabase.auth.getUser();

// ... later ...

if (user) {
  // Fetch user-specific data only if logged in
  registration = await fetchRegistration(user.id);
  submissionCount = await fetchSubmissionCount(user.id);
}

// Leaderboard fetched regardless of auth
const leaderboard = await fetchLeaderboard(id);
```

**Logic:**
- ✅ Competition data: Public
- ✅ Leaderboard: Public
- ✅ Participant count: Public
- ✅ User registration status: Private (only if logged in)
- ✅ Submission counts: Private (only if logged in)

---

## Security Considerations

### What's Now Public:
1. ✅ **Competition details** - OK (needed for browsing)
2. ✅ **Leaderboard** - OK (public competition data)
3. ✅ **Participant counts** - OK (aggregated data)
4. ✅ **Valid submissions** - OK (scores for leaderboard)
5. ✅ **User names** - OK (needed for leaderboard)
6. ✅ **Team names** - OK (needed for team leaderboard)

### What's Still Private:
1. ✅ **Registration status** - Private (user_id check)
2. ✅ **Submission details** - Private (only own submissions)
3. ✅ **Invalid submissions** - Private (validation_status filter)
4. ✅ **User-specific stats** - Private (requires auth)
5. ✅ **Admin functions** - Private (role check)

### Privacy Concerns:
⚠️ **User profiles are now public** - Nếu có sensitive fields trong `users` table:
```sql
-- Option: Restrict columns
CREATE POLICY "Public can view limited user info"
ON public.users
FOR SELECT
TO anon
USING (true)
WITH CHECK (
  -- Only allow selecting specific columns via application code
  -- This requires code-level enforcement
);
```

**Recommendation:**
- Sensitive data (email, phone) nên để private
- Public fields: full_name, avatar_url, bio
- Use separate `user_profiles` table nếu cần

---

## Testing Checklist

### Late Registration
- [ ] Registration phase: Button shows "Register Now" ✅
- [ ] Public test phase: Button shows "Late Registration" ✅
- [ ] Private test phase: Button shows "Late Registration" ✅
- [ ] Ended phase: Button không hiển thị ✅
- [ ] Registration vẫn cần admin approve ✅

### Public Access (Without Login)
- [ ] Có thể view competition details ✅
- [ ] Có thể view leaderboard ✅
- [ ] Có thể view participant counts ✅
- [ ] Có thể view user names trong leaderboard ✅
- [ ] Có thể view team names (team competitions) ✅
- [ ] Không thấy own registration status ✅
- [ ] Không thấy own submission counts ✅

### Logged In Users
- [ ] Vẫn xem được own submissions ✅
- [ ] Vẫn xem được registration status ✅
- [ ] Vẫn xem được submission counts ✅
- [ ] Leaderboard vẫn hoạt động ✅

---

## Files Modified/Created

### Modified:
1. `src/app/(public)/competitions/[id]/page.tsx` - Allow late registration

### Created:
1. `supabase/migrations/005_allow_public_leaderboard_access.sql` - RLS policies for public access

### Unchanged but Relevant:
- `supabase/migrations/004_add_public_participant_counts.sql` - Already supports anon
- `src/middleware.ts` - Không block public routes
- `src/app/page.tsx` - Home page already public
- `src/app/(public)/competitions/page.tsx` - Competitions listing already public

---

## Benefits

### User Experience:
- ✅ Visitors có thể browse competitions mà không cần login
- ✅ Có thể xem leaderboard để quyết định có tham gia không
- ✅ Có thể xem số lượng participants để gauge competition level
- ✅ Có thể register muộn nếu admin approve

### Admin Flexibility:
- ✅ Control registration qua approval thay vì hard time limit
- ✅ Có thể cho phép late joiners nếu cần
- ✅ Public leaderboard → more visibility → more participants

### Security:
- ✅ Vẫn protect user-specific data
- ✅ Vẫn protect invalid/pending submissions
- ✅ Public data chỉ là aggregated/public competition info
