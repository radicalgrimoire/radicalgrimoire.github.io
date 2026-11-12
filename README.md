# GadgetLogs

An Astro-based blog and document site, deployed to GitHub Pages.

## Site structure

| Path | Contents |
| --- | --- |
| `src/content/posts/` | Blog posts in Markdown |
| `src/content/docs/` | Documents in Markdown |
| `src/content/drafts/` | Unpublished drafts |
| `src/pages/` | Pages and content routes |
| `src/components/`, `src/layouts/` | Shared components and layouts |
| `src/styles/`, `public/assets/` | Styles and static assets |
| `site.config.yml` | Site information, navigation, and colors |

The site includes a home page, post archive, document index, About page, and
Giants Calendar. Pushes to `main` build and deploy the site to GitHub Pages.

## Local development

Requires Node.js 22.23.4 or newer and a Git checkout with full history.

```sh
npm install
npm run dev
```

Open the local URL shown in the terminal (normally `http://localhost:4321/`).
Stop the server with `Ctrl+C`. The home page orders entries by Git commit
time, so uncommitted changes do not affect that order and new files without
Git history are omitted.

- To include external Markdown, place a standalone link such as
  `[Document](https://raw.githubusercontent.com/user/repo/main/document.md "embed")`
  in the body. The linked Markdown is fetched at build time; edit the source
  in its own repository. Local content can appear before or after the embed.
- Document URLs follow their paths under `src/content/docs/` without `.md`;
  `index.md` maps to its containing folder. Changing a path changes its URL,
  and old document URLs are not redirected.
- Set a document's `order` to `0` to make it a category index. Category indexes
  are listed alphabetically by path; other order values sort documents within
  a category.
- New post filenames must follow `YYYY-MM-DD-slug`. Changing an existing
  filename or date can change its URL.
- Place images in `public/assets/` separately and reference `/assets/` paths.
- Saving does not commit or publish: review the changes, then commit and push.
