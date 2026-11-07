require "minitest/autorun"
require "nokogiri"
require "uri"

class DocsSidebarTest < Minitest::Test
  SITE = File.expand_path("../_site", __dir__)

  def html(path)
    Nokogiri::HTML(File.read(File.join(SITE, path), encoding: "UTF-8"))
  end

  def page_for_url(url)
    path = URI::DEFAULT_PARSER.unescape(URI.parse(url).path).sub(%r{\A/}, "")
    html(File.join(path, "index.html"))
  end

  def sidebar_categories(document)
    document.css(".sidebar-docs-categories a").map do |link|
      [link["href"], link.at_css(".sidebar-docs-category-name").text.strip, link.at_css(".sidebar-docs-count").text.strip]
    end
  end

  def test_categories_match_documents_directory_on_all_documents_pages
    directory = html("documents/index.html")
    expected = directory.css(".docs-directory a").map do |link|
      [link["href"], link.at_css(".docs-category-text strong").text.strip, link.at_css(".docs-count").text.strip]
    end
    refute_empty expected
    assert_equal expected, sidebar_categories(directory)

    expected.each do |url, _, count|
      category_page = page_for_url(url)
      assert_equal expected, sidebar_categories(category_page), url
      selected = category_page.at_css(".sidebar-docs-categories a[aria-current='page']")
      assert_equal url, selected["href"]
      documents = category_page.css(".docs-list a")
      assert_equal "#{documents.size} docs", count

      documents.each do |link|
        document_page = page_for_url(link["href"])
        assert_equal expected, sidebar_categories(document_page), link["href"]
        active = document_page.at_css(".sidebar-docs-categories a.is-section")
        assert_equal url, active["href"], link["href"]
        assert_empty document_page.css(".sidebar-docs-categories a[aria-current='page']")
      end
    end
  end

  def test_categories_are_not_shown_on_other_sections
    %w[index.html archive/index.html giants-calendar/index.html].each do |path|
      assert_empty html(path).css(".sidebar-docs-categories"), path
    end
  end
end
