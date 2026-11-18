# Development Instructions (Website Implementation & Maintenance)

## 1. Strict Rules (Non-Negotiable)
* **No Changes Before Approval**: Do NOT create, edit, or delete any code or config files (including `.github/workflows/`) without explicit user approval.
* **No Unauthorized Installations**: Do NOT install new packages, libraries, or Astro integrations (`npm install`, `npx astro add`, etc.) without explicit user approval.
* **No Unauthorized GitHub Actions Execution**: Do NOT manually trigger or re-run any GitHub Actions workflows (via `gh`, API, Web UI, etc.) without an explicit execution request from the user.
* **Autonomous Investigation (No Approval Needed)**: You may autonomously perform read-only actions—such as reading files, searching code, checking Git history, and viewing GitHub Actions run history/logs (`gh run list`, `gh run view --log`, etc.)—without prior approval.

## 2. Mandatory Workflow (Strict Order)
Upon receiving a task, **execute Step 1 and Step 2 consecutively without waiting for approval**, then stop immediately after presenting the plan.

1. **Investigation** [Autonomous]
   * Read relevant files, project structure, types, and styles to understand the scope and impact.
   * For bugs or CI errors, inspect the codebase and Actions logs to identify the root cause. (If the user only requested an investigation, report the findings here and stop.)
2. **Planning** [Autonomous -> Stop After Presenting]
   * Present a concrete plan covering: target files, specific changes/fixes, UI/UX and state management approach, any required new dependencies (for approval), and edge-case/regression handling.
   * **For UI changes, include a visual layout proposal (e.g., ASCII wireframe or structural layout breakdown).**
   * **STOP here and wait for explicit user review and approval.**
3. **Review**
   * Refine the plan based on user feedback. Do not proceed until explicitly approved.
4. **Implementation**
   * Implement strictly within the approved plan (no unrequested refactoring or spec changes).
   * After completion, report a summary of changes and verification steps (do not re-run workflows automatically).

## 3. Agent Skills Usage
Invoke the following installed skills **only when relevant to the task**, and reflect their guidance in the **Planning** phase:
* **`modern-web-guidance`**: Invoke when designing/implementing web features, optimizing performance/accessibility, or selecting modern Web APIs.
* **`ui-ux-pro-max`**: Invoke when designing or modifying UI, layouts, styling, or visual components.

## 4. UI & Astro Standards
* **UI Standards**:
  * Do NOT use raw/unstyled default browser HTML form appearances (`<input>`, `<select>`, `<button>`, etc.); always apply custom, cohesive styling.
  * Prioritize reusing existing shared components over creating new ones.
  * Follow a mobile-first responsive approach.
  * Semantic HTML and accessibility (`alt`, `aria-label`) are mandatory.
* **Astro Specific**:
  * Prioritize Astro's built-in features (Content Collections, View Transitions, Astro components, server-first rendering) over external solutions.
  * Keep client-side JavaScript (`client:*` directives, `<script>`) to an absolute minimum.
  * Never add new dependencies or Astro integrations without prior user approval.

## 5. Quality & Communication Standards
* Leave no unused `console.log` statements or dead code.
* If requirements or reproduction steps are ambiguous, ask clarifying questions during Investigation/Planning rather than guessing.
* **Always communicate and write reports to the user concisely in Japanese.**

* **UI Standards**:
  * Do NOT use raw/unstyled default browser HTML form appearances (`<input>`, `<select>`, `<button>`, etc.); always apply custom, cohesive styling.
  * Match the visual language (colors, border-radius, shadows, typography) of the surrounding application/admin UI—never leave isolated, unstyled blocks.
  * Prioritize reusing existing shared components over creating new ones.
  * Follow a mobile-first responsive approach.
  * Semantic HTML and accessibility (`alt`, `aria-label`) are mandatory.
