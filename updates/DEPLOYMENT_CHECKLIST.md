# 🚀 Deployment Checklist - Scoring Metrics Feature

## ✅ Pre-Deployment Checklist

### 1. Database Migrations
```bash
# Run migrations in order:
npx supabase migration up

# Or specific migrations:
npx supabase db push --file supabase/migrations/007_update_scoring_metrics.sql
npx supabase db push --file supabase/migrations/008_fix_best_score_sorting.sql
```

**Migrations to apply:**
- ✅ `007_update_scoring_metrics.sql` - Add new scoring metrics
- ✅ `008_fix_best_score_sorting.sql` - Fix best score trigger for regression

### 2. Edge Functions
```bash
# Deploy validate-csv function:
npx supabase functions deploy validate-csv
```

### 3. Frontend Build
```bash
# Install dependencies (if needed):
npm install

# Build production:
npm run build

# Test locally:
npm run dev
```

### 4. Environment Check
- ✅ Supabase project ID configured
- ✅ Edge function secrets set (if any)
- ✅ Storage buckets exist: `submissions`, `answer-keys`

---

## 🧪 Testing Checklist

### Before Deploy:
- [ ] Create competition với F1 Score → Submit → Verify score
- [ ] Create competition với Accuracy → Submit → Verify score
- [ ] Create competition với MAE → Submit → Verify score (lower is better)
- [ ] Create competition với RMSE → Submit → Verify score (lower is better)
- [ ] Verify leaderboard sorting (MAE/RMSE: lowest first)
- [ ] Verify best score marking works correctly
- [ ] Test validation errors (invalid CSV format)

### After Deploy:
- [ ] Smoke test: Create new competition
- [ ] Smoke test: Submit solution
- [ ] Verify Edge Function logs (no errors)
- [ ] Check database trigger logs

---

## 📋 Files Changed Summary

### Total: 13 files changed

**Database (2 files):**
- `supabase/migrations/007_update_scoring_metrics.sql`
- `supabase/migrations/008_fix_best_score_sorting.sql`

**Edge Functions (1 file):**
- `supabase/functions/validate-csv/index.ts`

**Frontend (10 files):**
- `src/lib/constants.ts`
- `src/types/database.types.ts`
- `src/app/(admin)/admin/competitions/create/page.tsx`
- `src/app/(admin)/admin/competitions/[id]/edit/EditCompetitionForm.tsx`
- `src/app/(admin)/admin/competitions/create/actions.ts`
- `src/app/(admin)/admin/competitions/[id]/edit/actions.ts`
- `src/app/(public)/competitions/[id]/submit/actions.ts`
- `src/app/(public)/competitions/[id]/page.tsx`
- `src/app/(public)/competitions/[id]/CompetitionTabs.tsx`

---

## ⚠️ Critical Fixes Applied

### 1. ✅ Leaderboard Sorting
**File:** `CompetitionTabs.tsx`
**Fix:** Dynamic sorting based on `higher_is_better` metadata
```typescript
const ascending = metricInfo?.higher_is_better === false;
.order('score', { ascending })
```

### 2. ✅ Best Score Trigger
**File:** `008_fix_best_score_sorting.sql`
**Fix:** Trigger now checks metric type and sorts accordingly
- Classification (F1, Accuracy, etc.): `ORDER BY score DESC`
- Regression (MAE, RMSE): `ORDER BY score ASC`

---

## 🎯 Deployment Commands

### Option 1: All-in-one
```bash
# Run from project root:
npx supabase migration up && \
npx supabase functions deploy validate-csv && \
npm run build
```

### Option 2: Step-by-step
```bash
# Step 1: Database
npx supabase migration up

# Step 2: Edge Functions
npx supabase functions deploy validate-csv

# Step 3: Frontend
npm run build

# Step 4: Deploy to hosting (Vercel/etc)
# (Follow your hosting provider's instructions)
```

---

## 📊 Feature Summary

### Supported Metrics:
- ✅ F1 Score (Classification ↑)
- ✅ Accuracy (Classification ↑)
- ✅ Precision (Classification ↑)
- ✅ Recall (Classification ↑)
- ✅ MAE (Regression ↓)
- ✅ RMSE (Regression ↓)

### Key Features:
- ✅ Admin can select metric when creating competition
- ✅ Auto-scoring via Edge Function
- ✅ Dynamic leaderboard sorting
- ✅ Correct best score marking
- ✅ Type-safe throughout

---

## 🔧 Rollback Plan

If issues occur after deployment:

### 1. Rollback Database
```bash
# Revert migrations:
npx supabase db reset

# Or manually:
DROP FUNCTION update_best_score() CASCADE;
ALTER TABLE competitions DROP CONSTRAINT competitions_scoring_metric_check;
```

### 2. Rollback Edge Function
```bash
# Deploy previous version (if you have backup)
npx supabase functions deploy validate-csv --legacy-bundle
```

### 3. Rollback Frontend
```bash
git revert <commit-hash>
npm run build
```

---

## 📞 Support

**Documentation:** See `updates/` folder for detailed docs

**Issues:** Check `IMPLEMENTATION_REVIEW.md` for known issues

**Questions:** Contact development team

---

**Deployment Date:** _________________
**Deployed By:** _________________
**Status:** ⬜ Success ⬜ Partial ⬜ Rollback
**Notes:** _________________________________________________
