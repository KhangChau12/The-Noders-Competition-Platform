# 🚀 Scoring Metrics - Quick Reference

## ✅ Đã Hoàn Thành

### 1. Database (1 file)
- `supabase/migrations/007_update_scoring_metrics.sql` - Migration cho constraint

### 2. Constants & Types (1 file)
- `src/lib/constants.ts` - Thêm `SCORING_METRICS` và `SCORING_METRIC_INFO`

### 3. Edge Functions (1 file)
- `supabase/functions/validate-csv/index.ts` - Implement 6 scoring metrics

### 4. Admin Forms (2 files)
- `src/app/(admin)/admin/competitions/create/page.tsx` - Dropdown với 6 options
- `src/app/(admin)/admin/competitions/[id]/edit/EditCompetitionForm.tsx` - Dropdown với 6 options

### 5. Server Actions (2 files)
- `src/app/(admin)/admin/competitions/create/actions.ts` - Validation
- `src/app/(admin)/admin/competitions/[id]/edit/actions.ts` - Validation

### 6. Submission Flow (1 file)
- `src/app/(public)/competitions/[id]/submit/actions.ts` - Xóa mock, gọi Edge Function

### 7. UI Components (2 files)
- `src/app/(public)/competitions/[id]/page.tsx` - Hiển thị metric với arrow
- `src/app/(public)/competitions/[id]/CompetitionTabs.tsx` - Leaderboard header + format

**TOTAL: 10 files changed, ~370 lines added**

---

## 📊 Supported Metrics

| Metric | Type | Better | Decimals |
|--------|------|--------|----------|
| F1 Score | Classification | Higher ↑ | 4 |
| Accuracy | Classification | Higher ↑ | 4 |
| Precision | Classification | Higher ↑ | 4 |
| Recall | Classification | Higher ↑ | 4 |
| MAE | Regression | Lower ↓ | 4 |
| RMSE | Regression | Lower ↓ | 4 |

---

## 🚀 Deployment Commands

```bash
# 1. Run migration
npx supabase migration up

# 2. Deploy Edge Function
npx supabase functions deploy validate-csv

# 3. Build frontend
npm run build
```

---

## ⚠️ TODO

1. **Fix Leaderboard Sorting** cho regression metrics (MAE/RMSE)
   - File: `src/app/(public)/competitions/[id]/CompetitionTabs.tsx`
   - Line: ~90 (fetchFullLeaderboard)
   - Change: `.order('score', { ascending: !metricInfo?.higher_is_better })`

---

## 🧪 Quick Test

1. Create competition với MAE
2. Upload answer key: `id,value\n1,10.5\n2,20.3`
3. Submit prediction: `id,value\n1,11.0\n2,19.8`
4. Expected MAE: `(0.5 + 0.5) / 2 = 0.5`

---

**Status:** ✅ Ready for Testing
