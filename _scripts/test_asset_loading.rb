require "minitest/autorun"
require "nokogiri"

class AssetLoadingTest < Minitest::Test
  SITE = File.expand_path("../_site", __dir__)
  RESOURCES = {
    "lightbox script" => ["[data-lightbox]", "script[src*='lightbox3.min.js']"],
    "lightbox stylesheet" => ["[data-lightbox]", "link[href*='lightbox3.css']"],
    "Instagram" => [".instagram-media", "script[src='https://www.instagram.com/embed.js']"],
    "X" => [".twitter-tweet", "script[src='https://platform.twitter.com/widgets.js']"],
    "Threads" => [".text-post-media", "script[src='https://www.threads.net/embed.js']"],
    "GitHub code view" => [".github-code-view", "script[src$='/assets/github-code-view.js']"]
  }.freeze

  def html(path)
    Nokogiri::HTML(File.read(File.join(SITE, path), encoding: "UTF-8"))
  end

  def test_site_pages_load_one_copy_of_each_required_resource
    paths = Dir.glob(File.join(SITE, "**", "*.html")).reject { |path| path.start_with?(File.join(SITE, "assets") + File::SEPARATOR) }
    refute_empty paths, "Build the site before running this test"
    paths.each do |path|
      document = Nokogiri::HTML(File.read(path, encoding: "UTF-8"))
      main = document.at_css("main")
      next unless main

      RESOURCES.each do |name, (feature, resource)|
        next unless main.at_css(feature)

        assert_equal 1, document.css(resource).size, "#{path}: #{name}"
      end
      if main.at_css("code.language-mermaid, .mermaid")
        assert_equal 1, document.css("script[type='module']").count { |script| script.text.include?("mermaid.esm.min.mjs") }, path
      end
    end
  end

  def test_pages_without_optional_features_do_not_load_their_resources
    %w[index.html giants-calendar/index.html].each do |path|
      document = html(path)
      RESOURCES.each do |name, (_, resource)|
        assert_empty document.css(resource), "#{path}: #{name}"
      end
      refute document.css("script[type='module']").any? { |script| script.text.include?("mermaid.esm.min.mjs") }, path
      refute document.css("script").any? { |script| script.text.include?("githubAlertTypes") }, path
      assert_equal 1, document.css("script[src*='bootstrap.bundle.min.js']").size
    end
  end

  def test_feature_pages_include_their_resources
    social = html("docs/test/social-embeds/index.html")
    %w[Instagram X Threads].each do |name|
      feature, resource = RESOURCES.fetch(name)
      refute_empty social.css("main #{feature}")
      assert_equal 1, social.css(resource).size
    end
    code = html("docs/test/github-code-view/index.html")
    assert_equal 1, code.css(RESOURCES.fetch("GitHub code view").last).size
    images = html("20221203-the-first-slamdunk/index.html")
    assert_equal 1, images.css(RESOURCES.fetch("lightbox script").last).size
    assert_equal 1, images.css(RESOURCES.fetch("lightbox stylesheet").last).size
    diagram = html("perforce/incident-response/index.html")
    assert diagram.at_css("main code.language-mermaid")
    assert diagram.css("script[type='module']").any? { |script| script.text.include?("mermaid.esm.min.mjs") }
    alerts = html("docs/test/github-alert-blocks/index.html")
    assert alerts.css("script").any? { |script| script.text.include?("githubAlertTypes") }
  end
end
