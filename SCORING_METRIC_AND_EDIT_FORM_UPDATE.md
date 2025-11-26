# Scoring Metric & Edit Form Update

## Summary
Thêm 2 cách tính điểm (Accuracy và F1 Score) và làm giao diện edit competition giống hệt create competition.

## Changes Made

### 1. Added Scoring Metric Dropdown to Create Form
**File**: `src/app/(admin)/admin/competitions/create/page.tsx`

- Thêm dropdown "Scoring Metric" vào phần Basic Information
- 2 options: F1 Score (`f1_score`) và Accuracy (`accuracy`)
- Default value: `f1_score`
- Xóa info box cũ về "Scoring Method" vì đã có dropdown

```tsx
<div>
  <label htmlFor="scoringMetric" className="block text-sm font-medium mb-2">
    Scoring Metric *
  </label>
  <select
    id="scoringMetric"
    name="scoringMetric"
    defaultValue="f1_score"
    className="w-full px-4 py-3 bg-bg-surface border border-border-default rounded-lg focus:outline-none focus:border-border-focus text-text-primary"
    required
  >
    <option value="f1_score">F1 Score</option>
    <option value="accuracy">Accuracy</option>
  </select>
  <p className="text-xs text-text-tertiary mt-1">
    Metric used to evaluate submissions. Higher scores rank better.
  </p>
</div>
```

### 2. Updated Create Competition Actions
**File**: `src/app/(admin)/admin/competitions/create/actions.ts`

- Extract `scoringMetric` từ formData (line 35)
- Lưu vào database thay vì hardcode 'F1 Score' (line 167)

```ts
const scoringMetric = formData.get('scoringMetric') as string;
// ...
scoring_metric: scoringMetric || 'f1_score',
```

### 3. Completely Rewrote Edit Competition Form
**File**: `src/app/(admin)/admin/competitions/[id]/edit/EditCompetitionForm.tsx` (NEW)

Tạo form edit giống **y hệt** create form với những điểm khác:

#### Structure Giống Create:
- ✅ Smart timeline calculation với duration inputs
- ✅ Auto-calculate dates khi thay đổi durations
- ✅ Visual timeline preview bar
- ✅ Basic Information section
- ✅ Competition Timeline section
- ✅ Settings section (Dataset URLs, Limits)
- ✅ Team Settings (conditional)
- ✅ Scoring Metric dropdown

#### Khác Biệt:
- ❌ **Removed** Answer Key upload section (can't update answer keys)
- ✅ **Pre-fill** all form fields with existing competition data
- ✅ **Initialize** timeline durations from existing dates
- ✅ **Button**: "Update Competition" thay vì "Create Competition"
- ✅ **Icon**: Save icon thay vì Plus icon
- ✅ **Action**: Calls `updateCompetition(competition.id, formData)`

#### Smart Timeline Initialization:
```ts
// Calculate initial durations from competition dates
const initialRegDuration = Math.ceil(
  (new Date(competition.registration_end).getTime() -
   new Date(competition.registration_start).getTime()) /
  (1000 * 60 * 60 * 24)
);

const initialPubDuration = Math.ceil(
  (new Date(competition.public_test_end).getTime() -
   new Date(competition.public_test_start).getTime()) /
  (1000 * 60 * 60 * 24)
);
```

#### Form Pre-filling:
```tsx
<Input
  id="title"
  name="title"
  type="text"
  defaultValue={competition.title}
  required
/>

<select
  id="scoringMetric"
  name="scoringMetric"
  value={scoringMetric}
  onChange={(e) => setScoringMetric(e.target.value)}
  required
>
  <option value="f1_score">F1 Score</option>
  <option value="accuracy">Accuracy</option>
</select>
```

### 4. Updated Edit Competition Actions
**File**: `src/app/(admin)/admin/competitions/[id]/edit/actions.ts`

- Extract `scoringMetric` từ formData (line 33)
- Include trong update query (line 69)

```ts
const scoringMetric = formData.get('scoringMetric') as string;
// ...
scoring_metric: scoringMetric || 'f1_score',
```

## Database Schema
Scoring metric đã có sẵn trong database schema:
```sql
scoring_metric TEXT NOT NULL DEFAULT 'f1_score',
```

Values được accept:
- `f1_score` - F1 Score metric
- `accuracy` - Accuracy metric

## UI/UX Improvements

### Create Competition Page
1. ✅ Dropdown để chọn scoring metric
2. ✅ Clear labeling và description
3. ✅ Consistent với các dropdowns khác

### Edit Competition Page
1. ✅ **Hoàn toàn giống create page**
2. ✅ Smart timeline với duration inputs
3. ✅ Visual preview bar
4. ✅ Pre-filled với data hiện tại
5. ✅ Easy to update dates bằng cách thay đổi durations
6. ✅ Scoring metric dropdown
7. ✅ Team settings (conditional)

### Benefits
- **Consistency**: Edit form giống y hệt create form → easier to learn
- **Better UX**: Smart timeline calculation thay vì manual date inputs
- **Flexible**: Admin có thể chọn scoring method phù hợp với từng competition
- **Future-proof**: Dễ dàng thêm metrics mới (precision, recall, etc.)

## Testing Checklist

### Create Competition
- ✅ Build successful
- ✅ Can select F1 Score
- ✅ Can select Accuracy
- ✅ Default to F1 Score
- ✅ Saves to database correctly

### Edit Competition
- ✅ Build successful
- ✅ Form layout giống create
- ✅ All fields pre-filled correctly
- ✅ Timeline calculation works
- ✅ Can change scoring metric
- ✅ Updates save successfully
- ✅ No answer key section

## Files Modified/Created

### Modified:
1. `src/app/(admin)/admin/competitions/create/page.tsx` - Added scoring dropdown
2. `src/app/(admin)/admin/competitions/create/actions.ts` - Handle scoringMetric
3. `src/app/(admin)/admin/competitions/[id]/edit/actions.ts` - Handle scoringMetric in update

### Created:
1. `src/app/(admin)/admin/competitions/[id]/edit/EditCompetitionForm.tsx` - New comprehensive edit form

### Unchanged:
- `src/app/(admin)/admin/competitions/[id]/edit/page.tsx` - Still renders EditCompetitionForm
- Database migrations - scoring_metric already exists
