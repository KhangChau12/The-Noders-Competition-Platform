# Participant Count Fix - RLS Bypass Solution

## Problem
Thí sinh không thể xem số lượng participants của các competitions do RLS policy chặn query từ bảng `registrations`. Users chỉ có thể xem registration của chính họ.

## Solution
Tạo một **database view** công khai để bypass RLS và expose số lượng participants một cách an toàn.

## Changes Made

### 1. Database Migration
**File**: `supabase/migrations/004_add_public_participant_counts.sql`

Tạo view `competition_participant_counts` để:
- Đếm số lượng approved registrations cho mỗi competition
- Bypass RLS restrictions
- Grant SELECT access cho authenticated và anon users
- View chỉ trả về dữ liệu tổng hợp (count), không expose thông tin cá nhân

```sql
CREATE OR REPLACE VIEW public.competition_participant_counts AS
SELECT
  competition_id,
  COUNT(DISTINCT user_id) as participant_count
FROM public.registrations
WHERE status = 'approved'
  AND deleted_at IS NULL
GROUP BY competition_id;
```

### 2. Code Updates

#### Updated Files:
1. **src/app/(user)/dashboard/page.tsx** (line 187-198)
   - Thay `.from('registrations')` → `.from('competition_participant_counts')`
   - Sử dụng `participant_count` field trực tiếp từ view

2. **src/app/(public)/competitions/page.tsx** (line 106-118)
   - Thay query registrations → query view
   - Giảm số lượng queries, improve performance

3. **src/app/page.tsx** (line 98-128)
   - Fetch participant counts một lần cho tất cả competitions
   - Map vào từng competition thay vì query riêng lẻ
   - Giảm N+1 query problem

## Benefits

### Security
- ✅ Không expose thông tin sensitive của users
- ✅ Vẫn giữ RLS policy intact trên bảng registrations
- ✅ Chỉ public aggregated data (counts)

### Performance
- ✅ Giảm số lượng queries (batch fetch thay vì individual queries)
- ✅ Database view được optimize bởi PostgreSQL
- ✅ Có thể cache view results nếu cần

### Maintainability
- ✅ Centralized logic trong database
- ✅ Dễ dàng update nếu cần thay đổi cách tính
- ✅ Consistent data across all pages

## Testing
Sau khi apply migration và restart server:
1. ✅ User dashboard hiển thị đúng participant counts
2. ✅ Competitions listing page hiển thị đúng
3. ✅ Home page featured competitions hiển thị đúng
4. ✅ Không có RLS violations
5. ✅ Build successfully

## Alternative Solutions Considered

### Option 1: Loosen RLS Policy ❌
- Cho phép authenticated users SELECT từ registrations
- **Rejected**: Expose too much data, security risk

### Option 2: Server-side API Route ❌
- Tạo API route riêng để count
- **Rejected**: Thêm complexity, slower performance

### Option 3: Database View ✅ (CHOSEN)
- Clean, secure, performant
- Follow PostgreSQL best practices
- Easy to maintain and extend
