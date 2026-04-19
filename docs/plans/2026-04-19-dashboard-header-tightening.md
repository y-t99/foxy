# Dashboard Header Tightening Implementation Plan

> **For Claude:** REQUIRED SUB-SKILL: Use superpowers:executing-plans to implement this plan task-by-task.

**Goal:** Tighten the logged-in dashboard header so it feels like a stable shell instead of a floating utility row.

**Architecture:** Extend the shared `ShellHeader` with an optional context rail that can hold a section label and signed-in user metadata without disturbing the lighter public pages. Keep the dashboard-specific copy in the dashboard route, then rebalance the spacing around the hero overview so the header and first content band read as one composed frame.

**Tech Stack:** Next.js App Router, React 19 server components, Tailwind CSS v4 utilities, Vitest

---

### Task 1: Lock the new shell shape with a component test

**Files:**
- Create: `src/components/shell-header.test.tsx`
- Modify: `src/components/shell-header.tsx`

**Step 1: Write the failing test**

Add a server-rendered component test that expects `ShellHeader` to render:
- the brand link
- the actions area
- an optional context block with a label and supporting metadata

**Step 2: Run test to verify it fails**

Run: `npm test -- src/components/shell-header.test.tsx`
Expected: FAIL because `ShellHeader` does not accept or render the context block yet.

**Step 3: Write minimal implementation**

Update `ShellHeader` to accept an optional `context` prop and render a stronger top-row structure with a dedicated left rail for brand plus context.

**Step 4: Run test to verify it passes**

Run: `npm test -- src/components/shell-header.test.tsx`
Expected: PASS

### Task 2: Apply the tighter shell to the dashboard

**Files:**
- Modify: `src/app/dashboard/page.tsx`

**Step 1: Use the new shell context**

Pass dashboard-specific context into `ShellHeader`, including a compact section label and the signed-in email/name metadata.

**Step 2: Rebalance first-screen spacing**

Tighten the spacing between the shell and the overview band so the top of the page feels anchored.

**Step 3: Keep public pages stable**

Verify the homepage, login, and register pages still compile against the updated shared header API without changing their current hierarchy.

### Task 3: Verify behavior and presentation

**Files:**
- Test: `src/components/shell-header.test.tsx`

**Step 1: Run focused checks**

Run:
- `npm test -- src/components/shell-header.test.tsx`
- `npm run lint`

Expected: PASS

**Step 2: Validate in browser**

Check the logged-in dashboard at desktop and mobile widths and confirm the header feels anchored, secondary actions stay secondary, and the first content band no longer visually floats away from the shell.
