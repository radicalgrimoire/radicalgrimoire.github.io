require "minitest/autorun"
require "nokogiri"
require "yaml"

class PerforceSourceDocsTest < Minitest::Test
  ROOT = File.expand_path("..", __dir__)
  DOCS = File.join(ROOT, "_docs", "perforce")
  SITE = File.join(ROOT, "_site")
  SECTIONS = {
    "user-guide" => "ユーザー操作",
    "server-management" => "サーバー管理",
    "troubleshooting" => "トラブル対応"
  }.freeze

  def html(path)
    Nokogiri::HTML(File.read(File.join(SITE, path), encoding: "UTF-8"))
  end

  def test_all_perforce_documents_are_imported_and_rendered_in_order
    files = Dir.glob(File.join(DOCS, "*.md")).reject { |path| File.basename(path) == "index.md" }
    assert_equal 25, files.length
    documents = files.map do |path|
      front_matter = File.read(path, encoding: "UTF-8").split("---", 3)[1]
      metadata = YAML.safe_load(front_matter)
      assert_match %r{\Ahttps://raw\.githubusercontent\.com/radicalgrimoire/radicalgrimoire/main/perforce/}, metadata.fetch("source_url")
      assert_equal "perforce", metadata.fetch("categories").first
      assert_equal 2, metadata.fetch("categories").length
      assert_includes SECTIONS.keys, metadata.fetch("categories")[1]
      refute metadata.key?("section")
      assert_match %r{\A/perforce/(?!\d+-)[a-z0-9-]+/\z}, metadata.fetch("permalink")
      metadata
    end
    assert_equal documents.size, documents.map { |doc| doc.fetch("order") }.uniq.size
    assert_equal documents.size, documents.map { |doc| doc.fetch("permalink") }.uniq.size

    directory = html("perforce/index.html")
    refute File.exist?(File.join(SITE, "1-perforce", "index.html"))
    assert_equal SECTIONS.values, directory.css(".docs-group-heading h3").map { |heading| heading.text.strip }
    SECTIONS.each do |section, title|
      expected = documents.select { |doc| doc["categories"][1] == section }.sort_by { |doc| doc["order"] }
      group = directory.css(".docs-group").find { |item| item.at_css("h3").text.strip == title }
      assert_equal expected.map { |doc| doc["permalink"] }, group.css(".docs-list a").map { |link| link["href"] }
    end
    documents.each do |doc|
      page = html(File.join(doc.fetch("permalink").delete_prefix("/"), "index.html"))
      assert_equal doc.fetch("title"), page.at_css(".post-title").text.strip
      assert_equal SECTIONS.fetch(doc.fetch("categories")[1]), page.at_css(".docs-article-section").text.strip
      refute_empty page.at_css(".post-content").text.strip
      refute_includes page.text, "Liquid error"
    end
  end

  def test_unsectioned_categories_do_not_show_a_section_label
    ["docs/nsfw-ish/dekaiketsu/index.html", "docs/test/github-alert-blocks/index.html"].each do |path|
      assert_nil html(path).at_css(".docs-article-section"), path
    end
  end

  def test_source_links_and_content_survive
    page = html("perforce/incident-response/index.html")
    links = page.css(".post-content a[href]").map { |link| link["href"] }
    assert_includes links, "https://www.perforce.com/perforce/doc.current/manuals/p4sag/Content/P4SAG/Home-p4sag.html"
    assert_includes page.at_css(".post-content").text, "db.have の復旧"
    assert page.at_css(".post-content code.language-mermaid")
    assert page.css("script").any? { |script| script.text.include?("mermaid.esm.min.mjs") }

    page = html("perforce/submitted-changelists/index.html")
    assert_equal 5, page.css(".post-content img").size
    assert_includes page.at_css(".post-content h1").text, "Submitted Changelists"
  end
end
