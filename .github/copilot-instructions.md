# Development Instructions (Website Implementation & Maintenance)

## 1. Non-Negotiable Guardrails
- **No Unauthorized Installations**: Never install packages or Astro integrations (`npm install`, `npx astro add`, etc.) without explicit approval.
- **No Unauthorized CI Execution**: Never trigger or re-run GitHub Actions workflows without an explicit request.
- **Read-Only Autonomy**: Reading files, searching code, checking Git history, and viewing CI logs (`gh run view --log`) require no approval.

## 2. Execution Workflow (Risk-Based Routing)
Classify the task first and follow the matching track:

### Track A: Fast Track (Direct Implementation — No Prior Approval Needed)
Use for **small, localized, reversible changes**:
- Copy/text updates, bug fixes within 1–2 files, minor CSS/styling tweaks, or adding missing `alt`/`aria-label`.
- **Flow**: Investigate → Implement directly → Verify → Report summary concisely in Japanese.

### Track B: Plan & Approve (Stop Before Editing)
Use for **high-impact or structural changes**:
- Creating/deleting files, modifying shared layouts/global styles, changing `.github/workflows/`, changing routing/state architecture, multi-component UI redesigns, or adding dependencies.
- **Flow**:
  1. **Investigate**: Inspect only directly relevant files (avoid full-repo scans).
  2. **Plan**: Present a brief bulleted plan (target files, key changes, UI structure outline, required dependencies) and **STOP for approval**.
  3. **Implement**: Execute strictly within the approved plan after confirmation, then verify build/types.

## 3. Agent Skills (On-Demand Only)
Invoke skills **only when building new features or solving complex problems** (skip for minor tweaks):
- **`ui-ux-pro-max`**: Only for new pages, major layout redesigns, or design-system work.
- **`modern-web-guidance`**: Only for performance bottlenecks, complex Web APIs, or accessibility audits.

## 4. UI & Astro Standards
- **Source of Truth**:
  - Before writing styles or components, inspect `src/components/` and `src/styles/` (or `tailwind.config.*`) to reuse existing tokens, colors, radius, shadows, and UI primitives.
- **UI & Styling**:
  - **Let the layout speak**: Avoid redundant secondary labels, helper text, and verbose descriptions; rely on clear visual hierarchy, spacing, and familiar UI patterns instead.
  - Never leave raw browser-default form elements (`<input>`, `<select>`, `<button>`); match the existing app/admin visual language.
  - Build mobile-first with semantic HTML and required accessibility attributes (`alt`, `aria-label`).
- **Astro Architecture**:
  - Prefer Astro built-ins (Content Collections, View Transitions, `.astro` components, server-first rendering).
  - Keep client-side JS to an absolute minimum; avoid `client:load` unless immediate interactivity on page load is strictly required (prefer `client:visible` or `client:idle`).
  - Leverage Astro's scoped `<style>` by default; avoid overly specific selectors or `:global()` overrides unless necessary.

## 5. Verification, Quality & Communication
- **Verify Before Reporting**:
  - **Track A**: Run `npx astro check` (plus any configured linters); skip full `npm run build` for localized text/CSS tweaks.
  - **Track B**: Always run both `npx astro check` and `npm run build` (plus any configured linters) for structural or wide-scope changes to ensure zero type or build errors.
- Remove unused `console.log` statements and dead code.
- If requirements are genuinely ambiguous, ask 1–2 concise clarifying questions instead of guessing.
- **Verify Actual Rendered Output**: When modifying UI or templates, check both server markup (`.astro`) and any client-side `<script>` DOM updates/CSS to ensure they do not overwrite each other.
- **Always respond and report concisely in Japanese.**