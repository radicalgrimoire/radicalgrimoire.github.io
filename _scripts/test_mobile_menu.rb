require "minitest/autorun"
require "nokogiri"

class MobileMenuTest < Minitest::Test
  SITE = File.expand_path("../_site", __dir__)
  ITEMS = [
    ["/archive/", "DailyLogs", "日記・ブログ記事", "bi-journal-text"],
    ["/documents/", "Documents", "技術資料・手順", "bi-folder2"],
    ["/giants-calendar/", "Giants Calendar", "ジャイアンツの試合日程", "bi-calendar3"]
  ].freeze

  def html(path)
    Nokogiri::HTML(File.read(File.join(SITE, path), encoding: "UTF-8"))
  end

  def test_dropdown_has_links_icons_and_descriptions
    menu = html("index.html").at_css(".menu-dropdown")
    toggle = menu.at_css("button.dropdown-toggle[data-bs-toggle='dropdown']")
    refute_nil toggle
    assert_equal "false", toggle["aria-expanded"]
    items = menu.css(".dropdown-item")
    assert_equal ITEMS.size, items.size
    ITEMS.zip(items).each do |(url, title, description, icon), item|
      assert_equal url, item["href"]
      assert_equal title, item.at_css(".menu-dropdown-title").text.strip
      assert_equal description, item.at_css(".menu-dropdown-description").text.strip
      assert item.at_css(".menu-dropdown-icon .#{icon}"), title
      assert item.at_css(".menu-dropdown-arrow[aria-hidden='true']"), title
    end
  end

  def test_selected_section_on_index_category_and_article_pages
    {
      "archive/index.html" => ["/archive/", true],
      "20260731-202607-giants-watch/index.html" => ["/archive/", false],
      "documents/index.html" => ["/documents/", true],
      "1-perforce/index.html" => ["/documents/", false],
      "docs/test/social-embeds/index.html" => ["/documents/", false],
      "giants-calendar/index.html" => ["/giants-calendar/", true]
    }.each do |path, (url, current)|
      selected = html(path).css(".menu-dropdown .dropdown-item.selected")
      assert_equal 1, selected.size, path
      assert_equal url, selected.first["href"], path
      if current
        assert_equal "page", selected.first["aria-current"], path
      else
        assert_nil selected.first["aria-current"], path
      end
    end
  end
end
