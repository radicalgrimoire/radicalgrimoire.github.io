require "fileutils"
require "json"
require "minitest/autorun"
require "open3"
require "rbconfig"
require "tmpdir"
require "jekyll"
require "nokogiri"

class RecentUpdatesTest < Minitest::Test
  ROOT = File.expand_path("..", __dir__)

  def run_command(dir, *command, env: {})
    output, error, status = Open3.capture3(env, *command, chdir: dir)
    assert status.success?, "#{command.join(' ')} failed: #{error}"
    output
  end

  def test_generator_tracks_commits_and_renames
    Dir.mktmpdir do |dir|
      FileUtils.mkdir_p(["#{dir}/_data", "#{dir}/_docs", "#{dir}/_posts"])
      run_command(dir, "git", "init", "-q")
      run_command(dir, "git", "config", "user.name", "Test")
      run_command(dir, "git", "config", "user.email", "test@example.invalid")
      File.write("#{dir}/_docs/old.md", "old")
      File.write("#{dir}/_posts/post.md", "post")
      run_command(dir, "git", "add", ".")
      run_command(dir, "git", "commit", "-qm", "Initial", env: {
        "GIT_AUTHOR_DATE" => "2020-01-01T10:00:00+09:00",
        "GIT_COMMITTER_DATE" => "2020-01-01T10:00:00+09:00"
      })
      run_command(dir, "git", "mv", "_docs/old.md", "_docs/new.md")
      run_command(dir, "git", "commit", "-qm", "Rename", env: {
        "GIT_AUTHOR_DATE" => "2020-01-02T10:00:00+09:00",
        "GIT_COMMITTER_DATE" => "2020-01-02T10:00:00+09:00"
      })
      File.write("#{dir}/_docs/untracked.md", "untracked")

      run_command(dir, RbConfig.ruby, "#{ROOT}/_scripts/generate_recent_updates.rb")
      updates = JSON.parse(File.read("#{dir}/_data/recent_updates.json"))
      assert_equal ["_docs/new.md", "_posts/post.md"], updates.map { |update| update.fetch("path") }
      assert_equal "2020-01-02T10:00:00+09:00", updates.first.fetch("updated_at")
    end
  end

  def test_home_filters_unpublished_documents_before_limiting_to_50
    Dir.mktmpdir do |dir|
      FileUtils.mkdir_p(["#{dir}/_data", "#{dir}/_docs", "#{dir}/_includes"])
      FileUtils.cp("#{ROOT}/_includes/recent-updates.html", "#{dir}/_includes")
      File.write("#{dir}/index.html", "---\n---\n{% include recent-updates.html %}\n")
      paths = ["future", "unpublished"] + (1..55).map { |i| "note#{i}" }
      paths.each do |name|
        extra = case name
                when "future" then "date: 2099-01-01\n"
                when "unpublished" then "published: false\n"
                when "note1" then "categories: [example]\ntags: [tagged]\n"
                else ""
                end
        File.write("#{dir}/_docs/#{name}.md", "---\ntitle: #{name}\n#{extra}---\nContent\n")
      end
      updates = paths.map { |name| { "path" => "_docs/#{name}.md", "updated_at" => "2020-01-01T00:00:00+09:00" } }
      File.write("#{dir}/_data/recent_updates.json", JSON.generate(updates))
      config = Jekyll.configuration(
        "source" => dir, "destination" => "#{dir}/_site", "quiet" => true,
        "collections" => { "docs" => { "output" => true } }
      )
      Jekyll::Site.new(config).process
      html = Nokogiri::HTML(File.read("#{dir}/_site/index.html"))
      items = html.css(".recent-updates .note-item")
      assert_equal 50, items.size
      assert_equal "note1", items.first.at_css(".note-title").text
      assert_equal "note50", items.last.at_css(".note-title").text
      assert_equal ["Documents", "example", "#tagged"], items.first.css(".note-taxonomies span").map(&:text)
      assert_equal "2020-01-01T00:00:00+09:00", items.first.at_css("time")["datetime"]
    end
  end
end
