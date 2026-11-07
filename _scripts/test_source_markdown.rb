require "minitest/autorun"
require "tmpdir"
require_relative "generate_source_markdown"

class SourceMarkdownTest < Minitest::Test
  def with_workspace
    Dir.mktmpdir do |dir|
      docs = File.join(dir, "docs")
      output = File.join(dir, "output")
      FileUtils.mkdir_p(File.join(docs, "nsfw-ish"))
      yield docs, output
    end
  end

  def declare(docs, name, extra: "", body: "")
    path = File.join(docs, "nsfw-ish", "#{name}.md")
    File.write(path, <<~DOC)
      ---
      title: "Test title"
      layout: page
      order: 1
      categories: [nsfw-ish, test]
      section: "Test section"
      permalink: /custom/#{name}/
      source_url: "https://raw.githubusercontent.com/user/repo/main/#{name}.md"
      #{extra}---
      #{body}
    DOC
    path
  end

  def generate(docs, output, &fetcher)
    SourceMarkdown.generate(document_dir: docs, output_dir: output, fetcher: fetcher)
  end

  def test_reads_ordinary_docs_front_matter_and_generates_body
    with_workspace do |docs, output|
      path = declare(docs, "first")
      original = File.read(path)
      generate(docs, output) { |url| "# Source title\n\nBody from #{url}\n" }
      result = File.read(File.join(output, "nsfw-ish", "first.md"))
      assert_includes result, "<h1"
      assert_includes result, "Source title"
      assert_includes result, "<p>Body from https://raw.githubusercontent.com/user/repo/main/first.md</p>"
      assert_equal original, File.read(path)
    end
  end

  def test_removes_matching_title_but_preserves_other_first_blocks_and_bom
    metadata = { "title" => "Test title", "source_url" => "https://raw.githubusercontent.com/user/repo/main/first.md" }
    refute_includes SourceMarkdown.render("\uFEFF# Test title\n\nBody\n", metadata, {}), "<h1"
    assert_includes SourceMarkdown.render("# First step\n\nBody\n", metadata, {}), "First step</h1>"
    assert_includes SourceMarkdown.render("> [!NOTE]\n> Body\n", metadata, {}), "<blockquote>"
  end

  def test_rewrites_relative_links_and_images_without_changing_code
    metadata = { "title" => "Test title", "source_url" => "https://raw.githubusercontent.com/user/repo/main/dir/first.md" }
    urls = { "https://raw.githubusercontent.com/user/repo/main/dir/second.md" => "/custom/second/" }
    source = "[Site](second.md#part) [GitHub](other.md) ![Image](../image.png)\n\n```text\n[Code](other.md)\n```\n"
    html = SourceMarkdown.render(source, metadata, urls)
    assert_includes html, "{{ '/custom/second/' | relative_url }}#part"
    assert_includes html, "https://github.com/user/repo/blob/main/dir/other.md"
    assert_includes html, "https://raw.githubusercontent.com/user/repo/main/image.png"
    assert_includes html, "[Code](other.md)"
  end

  def test_updates_body_and_removes_obsolete_generated_files
    with_workspace do |docs, output|
      declare(docs, "first")
      second = declare(docs, "second")
      generate(docs, output) { "# Old\n\nOld body\n" }
      File.delete(second)
      generate(docs, output) { "# New\n\nNew body\n" }
      assert_includes File.read(File.join(output, "nsfw-ish", "first.md")), "New body"
      refute_path_exists File.join(output, "nsfw-ish", "second.md")
    end
  end

  def test_missing_source_and_invalid_heading_preserve_existing_output
    with_workspace do |docs, output|
      declare(docs, "first")
      generate(docs, output) { "# Old\n\nOld body\n" }
      file = File.join(output, "nsfw-ish", "first.md")
      previous = File.read(file)
      ["", "  \n"].each do |source|
        assert_raises(RuntimeError) { generate(docs, output) { source } }
        assert_equal previous, File.read(file)
      end
      assert_raises(RuntimeError) { generate(docs, output) { raise "fetch failed" } }
      assert_equal previous, File.read(file)
    end
  end

  def test_rejects_local_body_to_avoid_discarding_it
    with_workspace do |docs, output|
      declare(docs, "first", body: "Local content")
      assert_raises(RuntimeError) { generate(docs, output) { "# Source\n" } }
    end
  end

  def test_ignores_regular_docs_and_removes_generated_files_after_source_removed
    with_workspace do |docs, output|
      path = declare(docs, "first")
      generate(docs, output) { "# Source\n" }
      File.write(path, "---\ntitle: Ordinary\nlayout: page\n---\nBody\n")
      generate(docs, output) { raise "unexpected fetch" }
      refute_path_exists File.join(output, "nsfw-ish", "first.md")
    end
  end

  def test_refuses_to_overwrite_non_generated_files
    with_workspace do |docs, output|
      declare(docs, "first")
      FileUtils.mkdir_p(File.join(output, "nsfw-ish"))
      path = File.join(output, "nsfw-ish", "first.md")
      File.write(path, "manually authored")
      assert_raises(RuntimeError) { generate(docs, output) { "# Source\n" } }
      assert_equal "manually authored", File.read(path)
    end
  end

  def test_rejects_non_github_or_insecure_urls
    ["http://raw.githubusercontent.com/file", "https://example.com/file"].each do |url|
      assert_raises(RuntimeError) { SourceMarkdown.fetch(url) }
    end
  end
end
