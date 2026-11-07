# Home update history

Before a local Jekyll build or preview, run:

```sh
ruby _scripts/generate_recent_updates.rb
bundle exec ruby _scripts/generate_source_markdown.rb
bundle exec jekyll build
```

Run the focused tests with `bundle exec ruby _scripts/test_recent_updates.rb`.

The Pages workflow runs the generator automatically after fetching the full Git
history. It writes ignored build data to `_data/recent_updates.json`; it does not
commit that file. Run it again after committing changes to refresh the list.
Without that data, the home page shows a notice and the original posts list.
Set `show_recent_updates: false` in `_config.yml` to show the posts archive
instead of the recent-updates home page.

The list is ordered by each tracked file's latest Git commit date, with paths
breaking ties. Uncommitted edits and changes to related assets do not count.
The home page includes only documents Jekyll publishes, up to 50 entries; files
under both `_posts` and `_docs`, including category and test pages, are eligible.

## Source Markdown

Use an ordinary Markdown file under `_docs/`, with the usual front matter and
an additional `source_url`:

```markdown
---
title: "Article title"
layout: page
order: 1
categories: [nsfw-ish]
source_url: "https://raw.githubusercontent.com/OWNER/REPOSITORY/main/path/article.md"
---
```

`source_url` must be a public HTTPS URL on `raw.githubusercontent.com`. The
title and other front matter follow normal docs conventions, including optional
`permalink`. The document must use `layout: page` and must not
have a local body. If the source's first heading matches `title`, it is omitted
to avoid displaying the title twice; otherwise its first heading is preserved.
Changing the original heading does not change the page title.

The generator renders the Markdown as HTML in ignored files under
`_includes/generated-source-docs/`, and removes obsolete generated files when
their docs no longer declare `source_url`. Do not edit these generated files.
The Pages workflow runs the generator before Jekyll; run it before each local
build or preview too. Generation requires network access and fails if a source
is invalid or a fetch fails. A plain Jekyll build without generation can use
stale generated content, or fail if it has not been generated yet.

Changes to the source repository appear after the Pages site is rebuilt;
source repository pushes do not automatically trigger a rebuild. Run the Pages
workflow manually or push a change to this repository to update the site.
Relative Markdown links to imported articles point to their site pages; other
relative links point to GitHub and relative images to the raw source repository.
Jekyll and GitHub may render some Markdown differently.

Run the focused tests with `bundle exec ruby _scripts/test_source_markdown.rb`.
After a build, check the Perforce imports with
`bundle exec ruby _scripts/test_perforce_source_docs.rb`.

## Page-specific assets

The default layout loads lightbox, social embeds, GitHub code views, Mermaid,
and GitHub alert handling only when the rendered page contains the corresponding
markup. Bootstrap and the site's base styles remain shared. Twitter and Threads
embed scripts are loaded once per page, even when multiple embeds are present.
After building the site, check the generated pages with:

```sh
bundle exec ruby _scripts/test_asset_loading.rb
```

## Archive article preview

Archive cards open a non-modal article panel without losing the current filter
or page. The panel loads the existing post in an iframe so post-specific assets
continue to run; its direct link and ordinary card links still work independently.
Without JavaScript, cards continue to navigate to their post pages. The panel can
be closed with its button or Escape, including from inside the article.
After building the site, check the generated markup with
`bundle exec ruby _scripts/test_archive_reader.rb`.

## Documents sidebar

On desktop, Documents and its category and article pages show category links
and document counts in the sidebar. Counts use the same category-index rules
as the Documents directory. After building, verify the generated navigation
with `bundle exec ruby _scripts/test_docs_sidebar.rb`.

The first entry in a document's `categories` identifies its Documents category.
For categories whose index declares `sections`, the second entry is a section
ID. The index maps each ID to a display title, for example:

```yaml
sections:
  - { id: server-management, title: "サーバー管理" }
```

Documents with no matching section appear under その他. Category index pages
themselves need only the first category; categories without sections do not
require a second entry.
Test section grouping with `bundle exec ruby _scripts/test_docs_sections.rb`.

## Mobile navigation

The mobile Logs dropdown uses the configured child navigation entries. Set a
child's `description` and optional Bootstrap `mobile_icon` in `_config.yml`;
otherwise its sidebar `icon` or the default journal icon is used. After building,
check the generated links and selected states with
`bundle exec ruby _scripts/test_mobile_menu.rb`.

## Giants Calendar

The Giants Calendar page fetches `giants.ics` from the public
`radicalgrimoire/giants-calendar` repository in the browser, so updating the ICS
does not require a site rebuild. Browser and GitHub caches can delay updates.
The page displays an error if the fetch or parsing fails. Upcoming timed events
and all-day events on or after the current date in Tokyo offer a Google Calendar
link that opens a prefilled event; saved events do not automatically sync with
later ICS updates.

The parser supports the source's all-day, Asia/Tokyo, floating, and UTC event
dates. Recurring events and other named time zones are not supported and result
in an error rather than an incomplete calendar. Run the focused tests with:

```sh
node --test _scripts/test_giants_calendar.cjs
```
