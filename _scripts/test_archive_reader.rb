require "minitest/autorun"
require "nokogiri"
require "uri"

class ArchiveReaderTest < Minitest::Test
  SITE = File.expand_path("../_site", __dir__)

  def html(path)
    Nokogiri::HTML(File.read(File.join(SITE, path), encoding: "UTF-8"))
  end

  def test_archive_has_accessible_reader_and_normal_post_links
    archive = html("archive/index.html")
    reader = archive.at_css("[data-archive-reader]")
    refute_nil reader
    assert reader.key?("hidden")
    assert_equal "記事プレビュー", reader["aria-label"]
    assert reader.at_css("button[data-archive-reader-close]")
    assert reader.at_css("[data-archive-reader-link]")
    assert reader.at_css("[data-archive-reader-content]")
    assert_equal 1, archive.css("script[src$='/assets/archive-reader.js']").size

    links = archive.css(".archive-card-link")
    refute_empty links
    links.each do |link|
      assert link.at_css(".archive-card-title")
      path = URI::DEFAULT_PARSER.unescape(URI.parse(link["href"]).path).sub(%r{\A/}, "")
      post = html(File.join(path, "index.html"))
      assert post.at_css(".post-article .post-content"), link["href"]
      assert_equal 1, post.css("script[src$='/assets/archive-post-preview.js']").size, link["href"]
      assert post.at_css("link[rel='canonical']"), link["href"]
    end
  end

  def test_unrelated_pages_do_not_load_preview_scripts
    home = html("index.html")
    assert_empty home.css("script[src$='/assets/archive-reader.js']")
    assert_empty home.css("script[src$='/assets/archive-post-preview.js']")
  end
end
