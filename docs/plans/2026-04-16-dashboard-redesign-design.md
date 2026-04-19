# Dashboard Redesign Design

**Date:** 2026-04-16
**Status:** Approved

## Goal

Redesign `/` and `/dashboard` into a clean minimalist product UI with an editorial feel. The interface should feel like a calm workspace instead of a generic SaaS landing page or boxed admin panel.

## Chosen Direction

- Visual style: editorial, warm white, quiet, document-like
- Palette: warm bone backgrounds, charcoal text, ultra-light dividers, restrained moss/brown accents
- Home page posture: application foyer, not a marketing landing page
- Dashboard posture: mixed layout with overview first, subscription/account actions second
- Motion: minimal and quiet; only subtle hover, border, and press states

## Experience Principles

1. Use typography and spacing for hierarchy before using color.
2. Replace heavy cards with lightly framed sections and open whitespace.
3. Keep the dashboard task-oriented: read status first, then act.
4. Keep the home page product-like and trustworthy instead of sales-driven.
5. Preserve all current billing/auth behavior and only redesign presentation.

## Information Architecture

### Home `/`

- Minimal top navigation with brand, login, and register links
- Primary introduction block with plain-language product framing
- Two-column editorial summary area instead of a grid of equal feature cards
- Lightweight operational footer note to reinforce “working product” tone

### Dashboard `/dashboard`

- Minimal header with home link and sign-out action
- Overview section with user identity, access state, billing cadence, and period timing
- Main status narrative area for active/inactive subscription states and billing notices
- Secondary grouped sections for billing actions and account record details

## Visual System

- Background: `#f7f4ee` / `#fbfaf7`
- Surface: `#fffdf8`
- Text: `#1f1d1a` primary, `#6d675f` secondary
- Borders: `#e7dfd2`
- Success accent: muted moss
- Caution accent: muted amber-brown
- Radius: tight (`10px` to `12px`)
- Shadows: nearly absent; rely on borders and contrast

## Content Tone

- Prefer software record language over marketing language
- Use labels like `Access active`, `Current period`, `Billing state`, `Workspace record`
- Keep descriptions specific and grounded in existing product behavior

## Implementation Scope

- Modify `src/app/page.tsx`
- Modify `src/app/dashboard/page.tsx`
- Modify `src/app/globals.css`
- Keep auth, billing, Prisma, and routing behavior unchanged
- No new dependencies

## Validation

- Run focused tests for any new pure UI content helpers introduced during implementation
- Run `npm test`
- Run `npm run lint`
- Run `npm run build`

## Notes

- A dedicated worktree was not created in this session.
- The brainstorming skill requested a git commit for the design doc, but this session follows the repo instruction not to commit unless the user explicitly asks.
