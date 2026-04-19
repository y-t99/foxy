# Homepage and Dashboard Minimal Refinement Implementation Plan

> **For Claude:** REQUIRED SUB-SKILL: Use superpowers:executing-plans to implement this plan task-by-task.

**Goal:** Refine the homepage and dashboard into a calm, high-end minimalist interface for non-technical users while preserving the existing auth and billing behavior.

**Architecture:** Keep the current App Router structure and server-rendered data flow intact, but tighten the content model, global design tokens, and page composition. Treat the homepage as a product foyer and the dashboard as a quiet working surface with clearer task hierarchy and reduced visual noise.

**Tech Stack:** Next.js 16 App Router, React 19, TypeScript, Tailwind CSS v4, Vitest

---

### Task 1: Update content expectations first

**Files:**
- Modify: `src/app/page-content.test.ts`
- Modify: `src/app/page-content.ts`

**Step 1: Write the failing test**

Update `src/app/page-content.test.ts` so it expects:
- homepage overview eyebrows to become `["How it works", "What you manage"]`
- homepage overview titles to become `["Understand the tool in one pass", "Generate content, then review the output"]`
- dashboard detail sections to become `["Generation flow", "Workspace record"]`

**Step 2: Run test to verify it fails**

Run: `pnpm test src/app/page-content.test.ts`
Expected: FAIL because the current content still reflects the earlier editorial wording.

**Step 3: Write minimal implementation**

Update `src/app/page-content.ts` with the new homepage overview copy and dashboard detail section name, keeping the types stable.

**Step 4: Run test to verify it passes**

Run: `pnpm test src/app/page-content.test.ts`
Expected: PASS

**Step 5: Commit**

```bash
git add src/app/page-content.test.ts src/app/page-content.ts
git commit -m "test: tighten homepage and dashboard content model"
```

### Task 2: Establish a quieter global visual system

**Files:**
- Modify: `src/app/globals.css`
- Modify: `src/app/layout.tsx`

**Step 1: Write the failing test**

Add or extend a simple rendering/content test only if needed to protect visible page-level expectations. Otherwise, use the existing content test coverage and treat this task as a visual-system refactor with manual verification.

**Step 2: Run test to verify it fails**

Run: `pnpm test`
Expected: Existing tests remain green before the visual changes.

**Step 3: Write minimal implementation**

Refine global tokens in `src/app/globals.css`:
- reduce accent prominence
- introduce calmer neutral surfaces and borders
- improve selection, focus, and typography defaults
- add a small shared utility layer for consistent shell spacing if needed

Update `src/app/layout.tsx` metadata so page titles remain descriptive for route announcements.

**Step 4: Run test to verify it passes**

Run: `pnpm test`
Expected: PASS

**Step 5: Commit**

```bash
git add src/app/globals.css src/app/layout.tsx
git commit -m "feat: establish minimalist global design tokens"
```

### Task 3: Refine the homepage into a calmer product foyer

**Files:**
- Modify: `src/app/page.tsx`
- Modify: `src/app/page-content.ts`

**Step 1: Write the failing test**

If needed, extend `src/app/page-content.test.ts` to assert any new structured homepage labels introduced for the quieter foyer layout.

**Step 2: Run test to verify it fails**

Run: `pnpm test src/app/page-content.test.ts`
Expected: FAIL if new structured content is added.

**Step 3: Write minimal implementation**

Update `src/app/page.tsx` to:
- simplify the hero copy and action hierarchy
- increase whitespace and improve alignment
- reduce visible chrome on secondary content
- make the supporting panel read as a workspace preview instead of a card stack
- keep the CTA path obvious for first-time users

**Step 4: Run test to verify it passes**

Run: `pnpm test src/app/page-content.test.ts`
Expected: PASS

**Step 5: Commit**

```bash
git add src/app/page.tsx src/app/page-content.ts src/app/page-content.test.ts
git commit -m "feat: refine homepage into quiet product foyer"
```

### Task 4: Refine the dashboard into a task-first workspace

**Files:**
- Modify: `src/app/dashboard/page.tsx`
- Modify: `src/app/page-content.ts`

**Step 1: Write the failing test**

If new dashboard labels are introduced, update `src/app/page-content.test.ts` first so the new structure is asserted before the page implementation changes.

**Step 2: Run test to verify it fails**

Run: `pnpm test src/app/page-content.test.ts`
Expected: FAIL if dashboard labels or section names changed.

**Step 3: Write minimal implementation**

Update `src/app/dashboard/page.tsx` to:
- reduce card noise and strengthen section rhythm
- make the primary generation/access area more prominent
- soften notices and account details
- use restrained dividers, spacing, and typography for supporting records
- keep billing actions and state messaging intact

**Step 4: Run test to verify it passes**

Run: `pnpm test src/app/page-content.test.ts`
Expected: PASS

**Step 5: Commit**

```bash
git add src/app/dashboard/page.tsx src/app/page-content.ts src/app/page-content.test.ts
git commit -m "feat: refine dashboard into calm workspace"
```

### Task 5: Verify the full refinement

**Files:**
- Modify: `src/app/page.tsx`
- Modify: `src/app/dashboard/page.tsx`
- Modify: `src/app/globals.css`
- Modify: `src/app/layout.tsx`
- Modify: `src/app/page-content.ts`
- Modify: `src/app/page-content.test.ts`

**Step 1: Run focused tests**

Run: `pnpm test src/app/page-content.test.ts`
Expected: PASS

**Step 2: Run full test suite**

Run: `pnpm test`
Expected: PASS

**Step 3: Run lint**

Run: `pnpm lint`
Expected: PASS

**Step 4: Run production build**

Run: `pnpm build`
Expected: PASS

**Step 5: Commit**

```bash
git add src/app/page.tsx src/app/dashboard/page.tsx src/app/globals.css src/app/layout.tsx src/app/page-content.ts src/app/page-content.test.ts docs/plans/2026-04-17-homepage-dashboard-minimal-design.md docs/plans/2026-04-17-homepage-dashboard-minimal.md .impeccable.md
git commit -m "feat: refine homepage and dashboard minimal UI"
```
