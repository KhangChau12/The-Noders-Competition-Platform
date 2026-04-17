# UI Sync Plan: Community -> Competition Platform

## Goal
Dong bo giao dien cua Competition Platform theo cap nhat moi nhat tu The Noders Community, tap trung vao:
- Club branding: The Noders Community
- Neural network background: ban chi tiet hon, toi uu hieu nang va reduced motion

## Changes Applied (Phase 1)

### 1) Branding updates in user-facing UI
- Updated club naming from `The Noders PTNK` -> `The Noders Community` in:
  - `src/app/layout.tsx` (metadata description + keywords)
  - `src/app/page.tsx` (hero copy)
  - `src/components/layout/Header.tsx` (brand text)
  - `src/components/layout/Footer.tsx` (description + copyright)
  - `src/app/(public)/verify/[code]/page.tsx` (certificate verification message)
  - `src/app/test-font/page.tsx` (font preview labels)

### 2) Neural background migration
- Replaced `src/components/ui/NeuralNetworkBackground.tsx` with the updated implementation from Community:
  - Denser node graph and richer connections
  - Traveling data particles on selected edges
  - Auto simplification for low-end devices or reduced-motion users
  - Separate desktop/mobile rendering strategy

### 3) Required animation support
- Added missing keyframes in `src/app/globals.css`:
  - `@keyframes nn-line-flow`
  - `@keyframes nn-particle-travel`

## Remaining UI sync items (Phase 2 - optional, can do next)
- Unify design tokens with Community palette naming (`dark-bg`, `dark-surface`, `dark-border`) or create a clear token bridge map.
- Align header/footer interaction details with Community style language (hover states, dropdown/card blur treatment).
- Evaluate whether links still using `thenodersptnk.com` and `thenodersptnk@gmail.com` should be migrated to new domain/email branding.
- Run visual QA across breakpoints:
  - Home hero overlap/layering with new background
  - Navbar readability on blur layers
  - CTA contrast ratios on gradients

## Suggested rollout
1. Complete Phase 2 token alignment in a dedicated PR.
2. Run snapshot comparisons for key pages (`/`, `/competitions`, `/dashboard`, `/verify/[code]`).
3. Perform accessibility pass (contrast, focus visibility, reduced motion behavior).
4. Ship with a short changelog note about branding + visual refresh.
