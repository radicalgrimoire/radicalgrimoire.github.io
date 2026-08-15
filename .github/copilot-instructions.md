# Copilot instructions for this repository

## Project scope

This repository is a personal Jekyll blog hosted on GitHub Pages. The site is static and content-driven. Favor small, deterministic changes over broad refactors.

The main content areas are:
- `_posts/` for published blog entries
- `_drafts/` for work-in-progress notes
- `_layouts/`, `_includes/`, and `_sass/` for site structure and styling
- `assets/images/` for image assets
- `README.md` for high-level project context

## Content and editorial conventions

- Write in a natural, readable style that matches the existing blog voice.
- Prefer clear Japanese prose for personal writing, but keep technical terminology accurate and readable in English where appropriate.
- Preserve the existing tone of the site: thoughtful, specific, and personal rather than marketing-heavy.
- When creating or editing posts, keep the content fact-based and grounded in real experience.
- Use front matter consistently for blog posts. Typical fields include `title`, `date`, `layout`, and sometimes `permalink`, `categories`, or `tags`.
- New post files should follow the repository pattern: `YYYY-MM-DD-slug.md` under `_posts/`.
- Drafts belong in `_drafts/` and should not be published accidentally.

## Jekyll and static-site rules

- This repo is not a React or Node application. Do not introduce framework-heavy patterns unless the site already uses them.
- Preserve Jekyll conventions and liquid template syntax when modifying layouts or includes.
- Keep URLs, permalinks, and file paths stable unless the change is specifically intended to change navigation.
- Prefer minimal CSS and HTML changes. The site values simplicity and readability.
- When adding images, keep files organized under `assets/images/` and use paths that match the existing structure.
- Prefer existing includes and layouts over creating new ad hoc patterns unless there is a clear reason.

## Change hygiene

- Keep patches focused and easy to review.
- Avoid unrelated cleanup in the same commit.
- Do not rename or move files casually; this can break links, permalinks, and published references.
- If a change affects post metadata, links, or site structure, verify the output still renders sensibly.
- Favor additive changes over deletions when fixing content issues.

## Validation

Before finalizing a meaningful change, run:

```bash
bundle exec jekyll build
```

For local preview during editing, use:

```bash
bundle exec jekyll serve
```

If the environment cannot run Jekyll locally, document the limitation clearly instead of guessing.

## Operational preference

- Small, regular commits are preferred.
- Write commit messages that describe the actual change, not generic labels.
- Keep the repository clean: no accidental debug code, temporary notes, or noisy formatting-only churn.
- When the task is content work, favor practical and accurate wording over vague filler.

## Suggested additions for future work

- Keep article metadata consistent across posts.
- Ensure accessibility basics like meaningful image alt text and readable headings are maintained.
- Maintain a healthy balance between technical notes, personal writing, and public-facing references.
- Avoid introducing dependencies or tooling that are not already part of the Jekyll site setup.
