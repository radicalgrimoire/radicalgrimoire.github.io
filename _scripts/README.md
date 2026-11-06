# Home update history

Before a local Jekyll build or preview, run:

```sh
ruby _scripts/generate_recent_updates.rb
bundle exec jekyll build
```

Run the focused tests with `bundle exec ruby _scripts/test_recent_updates.rb`.

The Pages workflow runs the generator automatically after fetching the full Git
history. It writes ignored build data to `_data/recent_updates.json`; it does not
commit that file. Run it again after committing changes to refresh the list.
Without that data, the home page shows a notice and the original posts list.

The list is ordered by each tracked file's latest Git commit date, with paths
breaking ties. Uncommitted edits and changes to related assets do not count.
The home page includes only documents Jekyll publishes, up to 50 entries; files
under both `_posts` and `_docs`, including category and test pages, are eligible.

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
