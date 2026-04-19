# Dashboard Redesign Implementation Plan

> **For Claude:** REQUIRED SUB-SKILL: Use superpowers:executing-plans to implement this plan task-by-task.

**Goal:** Rebuild the home page and dashboard into an editorial minimalist workspace UI without changing billing or auth behavior.

**Architecture:** Keep both routes as Server Components and move the redesign into page-local content structures plus shared global design tokens in `globals.css`. Use pure helper data where useful so we can add lightweight tests without introducing a client-side UI test stack.

**Tech Stack:** Next.js 16 App Router, React 19, Tailwind CSS v4, TypeScript, Vitest, ESLint

---

### Task 1: Add testable page content structures

**Files:**
- Create: `src/app/page-content.ts`
- Create: `src/app/page-content.test.ts`

**Step 1: Write the failing test**

Create tests that assert the exported home/dashboard content structures expose the approved editorial sections, including overview labels and workspace-record labels.

**Step 2: Run test to verify it fails**

Run: `npm test -- src/app/page-content.test.ts`
Expected: FAIL because `src/app/page-content.ts` does not exist yet.

**Step 3: Write minimal implementation**

Create the content module with typed arrays/objects for:
- home overview panels
- dashboard summary stats
- dashboard record rows

**Step 4: Run test to verify it passes**

Run: `npm test -- src/app/page-content.test.ts`
Expected: PASS

**Step 5: Refactor**

Keep the module small, literal, and reusable from both pages.

### Task 2: Rebuild the home page shell

**Files:**
- Modify: `src/app/page.tsx`
- Modify: `src/app/page-content.ts`
- Test: `src/app/page-content.test.ts`

**Step 1: Write the failing test**

Extend `src/app/page-content.test.ts` with expectations for any new home section labels needed by the redesigned foyer layout.

**Step 2: Run test to verify it fails**

Run: `npm test -- src/app/page-content.test.ts`
Expected: FAIL because the new section labels are missing.

**Step 3: Write minimal implementation**

Update `src/app/page-content.ts` and rebuild `src/app/page.tsx` to:
- use the new content structures
- replace the feature-card grid with editorial split sections
- preserve login/register CTA behavior

**Step 4: Run test to verify it passes**

Run: `npm test -- src/app/page-content.test.ts`
Expected: PASS

**Step 5: Refactor**

Tighten markup and class names without changing copy or behavior.

### Task 3: Rebuild the dashboard hierarchy

**Files:**
- Modify: `src/app/dashboard/page.tsx`
- Modify: `src/app/page-content.ts`
- Test: `src/app/page-content.test.ts`

**Step 1: Write the failing test**

Add expectations for dashboard summary labels and record labels required by the mixed overview/action layout.

**Step 2: Run test to verify it fails**

Run: `npm test -- src/app/page-content.test.ts`
Expected: FAIL because the dashboard content structure does not yet include the new labels.

**Step 3: Write minimal implementation**

Update `src/app/dashboard/page.tsx` to:
- keep auth and subscription lookups unchanged
- promote overview information above actions
- restyle notices as integrated editorial notes
- regroup account/billing sections into calmer framed blocks

**Step 4: Run test to verify it passes**

Run: `npm test -- src/app/page-content.test.ts`
Expected: PASS

**Step 5: Refactor**

Extract small local rendering helpers only if they reduce duplication.

### Task 4: Apply shared design tokens

**Files:**
- Modify: `src/app/globals.css`

**Step 1: Write the failing test**

No automated CSS-specific test is added because the repo has no stylesheet assertion harness; validation is done by lint/build plus visual consistency in the pages already backed by content tests.

**Step 2: Run test to verify it fails**

Not applicable.

**Step 3: Write minimal implementation**

Update global tokens and base styles for:
- warm monochrome palette
- editorial system font stack
- softer text defaults
- selection and body background alignment with the new pages

**Step 4: Run verification**

Run: `npm run lint`
Expected: PASS

**Step 5: Refactor**

Remove unused tokens and keep only shared primitives.

### Task 5: Final verification

**Files:**
- Modify: `src/app/page.tsx`
- Modify: `src/app/dashboard/page.tsx`
- Modify: `src/app/globals.css`
- Modify: `src/app/page-content.ts`
- Modify: `src/app/page-content.test.ts`

**Step 1: Run focused tests**

Run: `npm test -- src/app/page-content.test.ts`
Expected: PASS

**Step 2: Run broader tests**

Run: `npm test`
Expected: PASS

**Step 3: Run lint**

Run: `npm run lint`
Expected: PASS

**Step 4: Run production build**

Run: `npm run build`
Expected: PASS

**Step 5: Handoff**

Summarize the visual redesign, list touched files, and note that git commits are intentionally skipped unless the user asks.
