# Homepage and Dashboard Minimal Design

## Summary

Refine the `foxy` homepage and dashboard into a calmer, more premium interface for non-technical users. The updated UI should feel closer to Apple and Notion than a typical SaaS starter: quieter hierarchy, stronger typography, neutral surfaces, and fewer competing panels.

## Users and Jobs

- Primary users are non-technical users.
- On the homepage, they need to understand what the product does quickly and feel comfortable trying it.
- In the dashboard, they need to focus on generating content and managing results without being distracted by implementation details or billing jargon.

## Desired Tone

- Calm
- High-end
- Approachable
- Clear
- Non-technical

## Aesthetic Direction

Use an editorial minimalist direction with soft paper-like neutrals, restrained borders, generous whitespace, and compact but confident typography. The product should feel precise and modern without becoming stark or cold.

## Homepage Design

### Role

The homepage is a product foyer, not a marketing landing page. It should explain the product quickly and provide one obvious path to try it.

### Structure

- A restrained top bar with brand and entry actions
- One hero block with a concise explanation, premium spacing, and a single primary action
- A supporting proof area with a small number of structured overview items
- A secondary contextual panel that previews the workspace without adding noise
- A quiet footer with one-sentence product framing

### Interaction and Hierarchy

- Primary action should be visually obvious but not loud
- Secondary action should remain available without competing
- Layout should breathe more, especially around headings and sectional dividers
- Supporting content should read as editorial notes rather than marketing cards

## Dashboard Design

### Role

The dashboard is a working space. It should orient the user immediately, keep the primary task prominent, and treat billing and account details as supporting context.

### Structure

- A compact top bar with brand and sign-out
- A quiet overview band that introduces the current state
- A primary work area for content generation and access state
- Secondary areas for results, billing notes, and account records
- Notices that stay legible and calm instead of using loud status styling

### Interaction and Hierarchy

- The page should feel flatter and cleaner, with fewer card-like interruptions
- Content generation and result management should read as the main jobs
- Status summaries should be short and scannable
- Supporting records should use dividers and spacing rather than strong visual chrome

## Visual System

### Typography

- Strengthen hierarchy through contrast in scale, weight, and spacing
- Keep body copy readable and calm with controlled line lengths
- Use uppercase labels sparingly for orientation only
- Favor fixed rem-based sizing for the dashboard and restrained fluid emphasis only where appropriate

### Color

- Use a neutral light palette with subtle warmth
- Reduce accent color usage to functional states and minimal emphasis
- Avoid loud warm accents, saturated buttons, and tinted callouts unless they communicate state
- Maintain contrast and clarity for accessibility

### Layout

- Increase whitespace between major sections
- Reduce card density and nested container feeling
- Prefer clean dividers, asymmetry, and grouped spacing over repeated tiles
- Keep mobile and desktop layouts balanced and readable

## Accessibility

- Preserve clear page titles and `h1` structure for route announcements
- Maintain clear button and link affordances
- Keep contrast at WCAG-friendly levels
- Respect reduced-motion defaults by keeping motion minimal

## Validation

- Homepage communicates product purpose within a few seconds
- Homepage primary action is obvious without relying on heavy color
- Dashboard feels calmer and more task-focused than the current iteration
- Typography and spacing feel consistent across both pages
- Visual noise is reduced without making the product feel empty
