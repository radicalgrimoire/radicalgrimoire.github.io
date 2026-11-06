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
