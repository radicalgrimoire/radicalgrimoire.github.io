require "minitest/autorun"
require "fileutils"
require "jekyll"
require "nokogiri"
require "tmpdir"
require "yaml"

class DocsSectionsTest < Minitest::Test
  def test_second_category_controls_grouping_and_unmatched_documents
    Dir.mktmpdir do |root|
      includes = File.join(root, "_includes")
      docs = File.join(root, "_docs")
      FileUtils.mkdir_p(includes)
      FileUtils.mkdir_p(docs)
      %w[docs-category-list.html docs-list.html].each do |name|
        FileUtils.cp(File.expand_path("../_includes/#{name}", __dir__), includes)
      end

      write_doc(docs, "index", {
        "title" => "Index", "categories" => ["example"], "category_index" => true,
        "permalink" => "/example/", "sections" => [
          { "id" => "user-guide", "title" => "ユーザー操作" },
          { "id" => "server-management", "title" => "サーバー管理" }
        ]
      }, "{% include docs-category-list.html %}")
      write_doc(docs, "user", { "title" => "User", "categories" => ["example", "user-guide"], "order" => 1 })
      write_doc(docs, "admin", { "title" => "Admin", "categories" => ["example", "server-management"], "order" => 2 })
      write_doc(docs, "unknown", { "title" => "Unknown", "categories" => ["example", "unknown"], "order" => 3 })
      write_doc(docs, "missing", { "title" => "Missing", "categories" => ["example"], "section" => "ユーザー操作", "order" => 4 })
      write_doc(docs, "other", { "title" => "Other category", "categories" => ["elsewhere", "user-guide"], "order" => 5 })

      config = Jekyll.configuration(
        "source" => root, "destination" => File.join(root, "_site"), "theme" => nil,
        "collections" => { "docs" => { "output" => true, "permalink" => "/docs/:path/" } },
        "quiet" => true
      )
      Jekyll::Site.new(config).process
      page = Nokogiri::HTML(File.read(File.join(root, "_site", "example", "index.html"), encoding: "UTF-8"))
      groups = page.css(".docs-group").to_h do |group|
        [group.at_css("h3").text.strip, group.css(".docs-list-text > span:first-child").map { |item| item.text.strip }]
      end
      assert_equal({ "ユーザー操作" => ["User"], "サーバー管理" => ["Admin"], "その他" => ["Unknown", "Missing"] }, groups)
      assert_equal "4 docs", page.at_css(".docs-section-label span").text.strip
    end
  end

  def write_doc(dir, name, metadata, body = "")
    File.write(File.join(dir, "#{name}.md"), "#{metadata.to_yaml}---\n#{body}\n", encoding: "UTF-8")
  end
end
