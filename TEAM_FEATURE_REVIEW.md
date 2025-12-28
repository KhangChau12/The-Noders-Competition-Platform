# 🔍 TEAM FEATURE - COMPREHENSIVE REVIEW

**Review Date:** 2025-12-03
**Status:** ⚠️ **PARTIALLY IMPLEMENTED - MISSING CRITICAL FEATURES**

---

## 📊 EXECUTIVE SUMMARY

Tính năng Team đã được implement **cơ bản** với UI đẹp, nhưng còn **thiếu các chức năng quan trọng** để có thể sử dụng được trong thực tế. Hiện tại chỉ có thể tạo team, xem team, nhưng **KHÔNG THỂ**:
- ❌ Thêm/mời members vào team
- ❌ Đăng ký competition với team
- ❌ Quản lý team (edit/delete)
- ❌ Join team requests

---

## ✅ FEATURES ĐÃ HOÀN THÀNH

### 1. **Create Team** ✅
**File:** [src/app/(user)/teams/create/page.tsx](src/app/(user)/teams/create/page.tsx)

**Chức năng:**
- Form tạo team với validation
- Team name (required, 3-50 characters)
- Team description (optional, max 500 chars)
- Auto-add creator làm leader
- Auto-add creator vào team_members

**Database Flow:**
```typescript
1. Insert vào table `teams`:
   - name
   - description (nullable)
   - leader_id = current user

2. Insert vào table `team_members`:
   - team_id
   - user_id = current user (leader)
```

**RLS Check:** ✅ PASS
- Policy: "Users can create teams" - CHECK(auth.uid() = leader_id)
- Policy: "Team leaders can add members" - Leader có thể add chính mình

**Status:** ✅ **FULLY WORKING**

---

### 2. **List Teams** ✅
**File:** [src/app/(user)/teams/page.tsx](src/app/(user)/teams/page.tsx)

**Chức năng:**
- Hiển thị tất cả teams mà user là member
- Show leader badge nếu user là leader
- Hiển thị team stats (members count, created date)
- Empty state khi chưa có teams

**Query:**
```typescript
// Get teams where user is member
team_members
  .select(*, teams(*, leader:users))
  .eq('user_id', user.id)
```

**RLS Check:** ✅ PASS
- Policy: "Anyone can view team members" - USING(true)
- Policy: "Anyone can view teams" - USING(true)

**Status:** ✅ **FULLY WORKING**

---

### 3. **Team Detail Page** ✅
**File:** [src/app/(user)/teams/[id]/page.tsx](src/app/(user)/teams/[id]/page.tsx)

**Chức năng:**
- Hiển thị team info (name, description, created date)
- Hiển thị team leader với badge
- Liệt kê tất cả members
- Show "Manage Team" button cho leader (chưa implement action)
- Show "Request to Join" cho non-members (chưa implement action)

**Queries:**
```typescript
1. Get team details:
   teams.select(*, leader:users)

2. Get team members:
   team_members.select(*, users)
```

**RLS Check:** ✅ PASS
- Public read access

**Status:** ✅ **UI COMPLETE, ACTIONS MISSING**

---

## ❌ FEATURES CHƯA IMPLEMENT (CRITICAL)

### 1. **Add/Invite Members to Team** ❌ CRITICAL
**Status:** ⚠️ **NOT IMPLEMENTED**

**Vấn đề:**
- Không có UI để invite members
- Không có action để add members
- Team chỉ có 1 member (leader) mãi mãi

**Cần làm:**
```typescript
// File: src/app/(user)/teams/[id]/actions.ts (MISSING)
export async function inviteMember(teamId: string, email: string) {
  // 1. Check if current user is leader
  // 2. Find user by email
  // 3. Check if user already in team
  // 4. Insert into team_members
  // 5. (Optional) Send invitation email
}

export async function removeMember(teamId: string, userId: string) {
  // 1. Check if current user is leader
  // 2. Cannot remove leader
  // 3. Delete from team_members
}
```

**UI Component cần thêm:**
- Modal/Form để nhập email member
- List members với "Remove" button cho leader
- Invitation system (optional)

---

### 2. **Register Competition with Team** ❌ CRITICAL
**Status:** ⚠️ **NOT IMPLEMENTED**

**File hiện tại:** [src/app/(public)/competitions/[id]/register/actions.ts](src/app/(public)/competitions/[id]/register/actions.ts)

**Vấn đề:**
```typescript
// Hiện tại CHỈ hỗ trợ individual registration
const { error } = await supabase.from('registrations').insert({
  user_id: user.id,           // ✅ Individual
  competition_id: competitionId,
  status: 'pending',
  // ❌ MISSING: team_id field
});
```

**Cần fix:**
```typescript
export async function registerForCompetition(
  competitionId: string,
  type: 'individual' | 'team',
  teamId?: string
) {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();

  // Check competition type
  const { data: competition } = await supabase
    .from('competitions')
    .select('participation_type, min_team_size, max_team_size')
    .eq('id', competitionId)
    .single();

  if (competition.participation_type === 'team' && !teamId) {
    return { error: 'Team registration required' };
  }

  if (type === 'team') {
    // Validate team
    const { data: team } = await supabase
      .from('teams')
      .select('*, team_members(count)')
      .eq('id', teamId)
      .single();

    // Check team size constraints
    const memberCount = team.team_members[0].count;
    if (memberCount < competition.min_team_size) {
      return { error: `Team must have at least ${competition.min_team_size} members` };
    }
    if (memberCount > competition.max_team_size) {
      return { error: `Team cannot exceed ${competition.max_team_size} members` };
    }

    // Check if user is team member
    const { data: isMember } = await supabase
      .from('team_members')
      .select('id')
      .eq('team_id', teamId)
      .eq('user_id', user.id)
      .single();

    if (!isMember) {
      return { error: 'You are not a member of this team' };
    }

    // Insert team registration
    await supabase.from('registrations').insert({
      team_id: teamId,
      competition_id: competitionId,
      status: 'pending',
    });
  } else {
    // Individual registration (existing code)
    await supabase.from('registrations').insert({
      user_id: user.id,
      competition_id: competitionId,
      status: 'pending',
    });
  }

  return { success: true };
}
```

**UI Changes cần thiết:**

File: [src/app/(public)/competitions/[id]/register/page.tsx](src/app/(public)/competitions/[id]/register/page.tsx)

```tsx
// Cần thêm:
1. Dropdown để chọn team (nếu competition type = 'team')
2. Hiển thị team members và validate size
3. Check nếu team đủ điều kiện

// Example UI:
{competition.participation_type === 'team' && (
  <div>
    <label>Select Your Team</label>
    <select name="team_id">
      {userTeams.map(team => (
        <option value={team.id}>
          {team.name} ({team.member_count} members)
        </option>
      ))}
    </select>
    <p>Team must have {competition.min_team_size}-{competition.max_team_size} members</p>
  </div>
)}
```

---

### 3. **Manage Team (Edit/Delete)** ❌
**Status:** ⚠️ **NOT IMPLEMENTED**

**Vấn đề:**
- Button "Manage Team" tồn tại nhưng không làm gì
- Không thể edit team name/description
- Không thể delete team

**Cần làm:**
```typescript
// File: src/app/(user)/teams/[id]/actions.ts
export async function updateTeam(teamId: string, data: {
  name?: string;
  description?: string;
}) {
  // 1. Check if user is leader
  // 2. Update teams table
}

export async function deleteTeam(teamId: string) {
  // 1. Check if user is leader
  // 2. Check if team has active registrations
  // 3. Delete team (CASCADE will delete members)
}
```

**UI Component:**
- Team settings page/modal
- Edit form
- Delete confirmation dialog

---

### 4. **Join Team Requests** ❌
**Status:** ⚠️ **NOT IMPLEMENTED**

**Vấn đề:**
- Button "Request to Join" không làm gì
- Không có invitation/request system

**Cần làm:**
- Table mới: `team_join_requests` hoặc `team_invitations`
- Actions: send request, approve/reject request
- Notifications cho team leader

---

## 🔐 RLS POLICIES REVIEW

### ✅ Policies đã có và đúng:

```sql
-- teams table
✅ "Anyone can view teams" - USING(true)
✅ "Users can create teams" - WITH CHECK(auth.uid() = leader_id)
✅ "Team leaders can update teams" - USING(auth.uid() = leader_id)
✅ "Team leaders can delete teams" - USING(auth.uid() = leader_id)

-- team_members table
✅ "Anyone can view team members" - USING(true)
✅ "Team leaders can add members" - WITH CHECK(EXISTS team.leader_id = auth.uid())
✅ "Team leaders can remove members" - USING(EXISTS team.leader_id = auth.uid())

-- registrations table
✅ "Users can create registrations" (individual)
✅ "Team leaders can create registrations" (team) - WITH CHECK(EXISTS teams.leader_id = auth.uid())
```

### ⚠️ Potential Issues:

1. **Team Registration Validation:**
   - RLS không check team size constraints
   - Cần validate ở application level

2. **Team Deletion:**
   - Cần check active registrations trước khi xóa
   - Hoặc implement soft delete

---

## 🎯 DATABASE SCHEMA REVIEW

### ✅ Tables đã đúng:

```sql
-- teams
✅ id, name (UNIQUE), description, leader_id, avatar_url, timestamps

-- team_members
✅ id, team_id, user_id, joined_at
✅ UNIQUE constraint: (team_id, user_id)
✅ CASCADE delete when team deleted

-- registrations
✅ Support both user_id AND team_id
✅ CHECK constraint: one of user_id or team_id must be set
✅ UNIQUE constraints for both individual and team registrations
```

### 🤔 Thiếu (Optional):

```sql
-- team_invitations (nếu cần invitation system)
CREATE TABLE team_invitations (
  id UUID PRIMARY KEY,
  team_id UUID REFERENCES teams(id),
  email TEXT,
  invited_by UUID REFERENCES users(id),
  status TEXT CHECK (status IN ('pending', 'accepted', 'rejected')),
  created_at TIMESTAMPTZ,
  expires_at TIMESTAMPTZ
);
```

---

## 📝 SUBMISSION FLOW REVIEW

### Individual Submissions ✅
```typescript
// File: src/app/(user)/competitions/[id]/submit/page.tsx (assumed)
{
  user_id: currentUser.id,
  team_id: null,
  submitted_by: currentUser.id,
  // ...
}
```

### Team Submissions ❌
**Status:** CHƯA KIỂM TRA, có thể chưa support

**Cần check:**
1. UI có cho phép chọn team không?
2. Validate: user phải là member của team
3. Validate: team phải đã đăng ký competition
4. Insert submission với team_id

---

## 🚨 CRITICAL ISSUES SUMMARY

| Feature | Status | Impact | Priority |
|---------|--------|--------|----------|
| Add/Invite Members | ❌ Missing | 🔴 CRITICAL | P0 |
| Team Registration for Competition | ❌ Missing | 🔴 CRITICAL | P0 |
| Team Submissions | ❓ Unknown | 🔴 CRITICAL | P0 |
| Edit Team | ❌ Missing | 🟡 Medium | P1 |
| Delete Team | ❌ Missing | 🟡 Medium | P1 |
| Join Requests | ❌ Missing | 🟢 Low | P2 |
| Team Invitations | ❌ Missing | 🟢 Low | P2 |

---

## ✅ READINESS CHECKLIST

### Core Team Features:
- [x] Create team
- [x] View team list
- [x] View team details
- [ ] **Add/invite members** ❌ BLOCKING
- [ ] Edit team
- [ ] Delete team

### Competition Integration:
- [x] Individual registration
- [ ] **Team registration** ❌ BLOCKING
- [ ] **Team submission** ❌ BLOCKING
- [ ] Team leaderboard (có thể đã có)

### User Experience:
- [x] UI/UX design
- [ ] Member management UI ❌
- [ ] Team selection in registration ❌
- [ ] Error handling
- [ ] Success notifications

---

## 🎯 VERDICT

### ⚠️ **STATUS: NOT PRODUCTION READY**

**Reasons:**
1. ❌ Team chỉ có 1 member (leader) - không thể thêm members
2. ❌ Không thể đăng ký competition với team
3. ❌ Không thể submit bài với team (chưa kiểm tra)

**Can Use For:**
- ✅ Individual competitions (fully working)
- ✅ Demo team UI (nhưng không functional)

**Cannot Use For:**
- ❌ Team competitions (core feature bị thiếu)

---

## 📋 RECOMMENDED IMPLEMENTATION PLAN

### Phase 1: Critical Features (1-2 days)
**Goal:** Make team competitions usable

1. **Add Members to Team** (4-6 hours)
   - Create actions.ts cho team management
   - Add member form/modal
   - List members với remove button
   - RLS đã có sẵn ✅

2. **Team Registration** (3-4 hours)
   - Update registerForCompetition action
   - Add team selection UI
   - Validate team size
   - Handle team_id in registrations

3. **Team Submissions** (2-3 hours)
   - Check current submit page
   - Add team context
   - Validate team registration
   - Insert with team_id

### Phase 2: Management Features (1 day)
**Goal:** Full CRUD for teams

4. **Edit Team** (2-3 hours)
   - Settings modal
   - Update action
   - Form validation

5. **Delete Team** (2-3 hours)
   - Delete confirmation
   - Check active registrations
   - Cascade handling

### Phase 3: Advanced Features (2-3 days)
**Goal:** Better UX

6. **Join Requests / Invitations**
   - Request system
   - Notifications
   - Email invites (optional)

7. **Team Analytics**
   - Team performance dashboard
   - Submission history
   - Member contributions

---

## 🔧 QUICK FIXES (If Needed ASAP)

### Temporary Workaround for Testing:

```sql
-- Manually add members via SQL (for testing only)
INSERT INTO team_members (team_id, user_id)
VALUES ('team-uuid', 'user-uuid');

-- Manually register team (for testing only)
INSERT INTO registrations (team_id, competition_id, status)
VALUES ('team-uuid', 'competition-uuid', 'approved');
```

⚠️ **Warning:** Đây chỉ là workaround, không thể dùng cho production!

---

## 📊 CONCLUSION

Tính năng Team có **foundation tốt** với:
- ✅ Database schema hoàn chỉnh
- ✅ RLS policies đầy đủ
- ✅ UI/UX đẹp và professional

Nhưng thiếu **critical features** để có thể sử dụng:
- ❌ Member management
- ❌ Team registration flow
- ❌ Team submission flow

**Ước tính thời gian:** 3-5 ngày để hoàn thiện đầy đủ tính năng team.

**Recommendation:**
- Nếu cần **GẤP**: Focus vào Phase 1 (critical features)
- Nếu có **thời gian**: Implement đầy đủ cả 3 phases

---

**Reviewed by:** Claude Code
**Date:** 2025-12-03
**Next Review:** After implementing Phase 1
