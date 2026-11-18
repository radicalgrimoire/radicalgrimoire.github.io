# Development Instructions (Website Implementation & Maintenance)

## 1. Strict Rules (Non-Negotiable)
* **No Changes Before Approval**: Do NOT create, edit, or delete any code or config files (including `.github/workflows/`) without explicit user approval.
* **No Unauthorized GitHub Actions Execution**: Do NOT manually trigger or re-run any GitHub Actions workflows (via `gh`, API, Web UI, etc.) without an explicit execution request from the user.
* **Autonomous Investigation (No Approval Needed)**: You may autonomously perform read-only actions—such as reading files, searching code, checking Git history, and viewing GitHub Actions run history/logs (`gh run list`, `gh run view --log`, etc.)—without prior approval.

## 2. Mandatory Workflow (Strict Order)
Upon receiving a task, **execute Step 1 and Step 2 consecutively without waiting for approval**, then stop immediately after presenting the plan.

1. **Investigation** [Autonomous]
   * Read relevant files, project structure, types, and styles to understand the scope and impact.
   * For bugs or CI errors, inspect the codebase and Actions logs to identify the root cause. (If the user only requested an investigation, report the findings here and stop.)
2. **Planning** [Autonomous -> Stop After Presenting]
   * Present a concrete plan covering: target files, specific changes/fixes, UI/UX and state management approach, and edge-case/regression handling.
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

## 4. Coding & Communication Standards
* Follow mobile-first, responsive design, semantic HTML, and accessibility best practices (`alt`, `aria-label`).
* Reuse existing shared components; leave no unused `console.log` statements or dead code.
* If requirements or reproduction steps are ambiguous, ask clarifying questions during Investigation/Planning rather than guessing.
* **Always communicate and write reports to the user concisely in Japanese.**
