require "fileutils"
require "net/http"
require "uri"
require "yaml"
require "kramdown"
require "kramdown-parser-gfm"

module SourceMarkdown
  DOCUMENTS = File.expand_path("../_docs", __dir__)
  OUTPUT = File.expand_path("../_includes/generated-source-docs", __dir__)
  MARKER = "{% comment %}Generated from source Markdown; do not edit.{% endcomment %}\n"
  INCLUDE_PATH = /\A[\w\/.\-()+~\#@]+\z/

  def self.fetch(url)
    uri = URI.parse(url)
    unless uri.is_a?(URI::HTTPS) && uri.host == "raw.githubusercontent.com" && uri.port == 443 && !uri.userinfo
      raise "Unsupported source Markdown URL: #{url}"
    end

    response = Net::HTTP.start(uri.host, uri.port, use_ssl: true, open_timeout: 10, read_timeout: 30) do |http|
      http.get(uri.request_uri)
    end
    raise "Failed to fetch source Markdown #{url}: HTTP #{response.code}" unless response.is_a?(Net::HTTPSuccess)

    content = response.body.dup.force_encoding(Encoding::UTF_8)
    raise "Source Markdown is not valid UTF-8: #{url}" unless content.valid_encoding?

    content
  end

  def self.documents(directory)
    raise "Documents directory not found: #{directory}" unless Dir.exist?(directory)

    Dir.glob(File.join(directory, "**", "*.md")).sort.filter_map do |path|
      text = File.read(path, encoding: "UTF-8")
      front_matter = /\A---\s*\r?\n(.*?)\r?\n---\s*(?:\r?\n|\z)/m.match(text)
      next unless front_matter && front_matter[1].match?(/^source_url\s*:/)

      metadata = YAML.safe_load(front_matter[1])
      unless metadata.is_a?(Hash) && metadata["source_url"].is_a?(String) && !metadata["source_url"].empty?
        raise "Invalid source_url in #{path}"
      end
      raise "Source document must use the page layout: #{path}" unless metadata["layout"] == "page"
      raise "Source document must not contain a local body: #{path}" unless text[front_matter.end(0)..].strip.empty?

      relative = path.delete_prefix("#{directory}/").tr("\\", "/")
      unless INCLUDE_PATH.match?(relative) && !relative.match?(%r{[./]{2,}})
        raise "Unsupported source document path: #{path}"
      end
      [relative, metadata]
    end
  end

  def self.resolve_link(target, source_url, urls, image: false)
    return target if target.nil? || target.empty? || target.start_with?("#", "/", "//")
    uri = URI.parse(target)
    return target if uri.scheme

    absolute = URI.join(source_url, target)
    base = absolute.dup
    base.query = nil
    base.fragment = nil
    if !image && (local = urls[base.to_s])
      suffix = ""
      suffix += "?#{absolute.query}" if absolute.query
      suffix += "##{absolute.fragment}" if absolute.fragment
      return "{{ '#{local}' | relative_url }}#{suffix}"
    end
    return absolute.to_s if image

    parts = absolute.path.split("/")
    raise "Invalid source URL for relative link: #{source_url}" if parts.length < 5

    absolute.host = "github.com"
    absolute.path = "/#{parts[1]}/#{parts[2]}/blob/#{parts[3..].join('/')}"
    absolute.to_s
  end

  def self.rewrite_links(element, source_url, urls)
    if element.type == :a || element.type == :img
      key = element.type == :a ? "href" : "src"
      element.attr[key] = resolve_link(element.attr[key], source_url, urls, image: element.type == :img)
    end
    element.children.each { |child| rewrite_links(child, source_url, urls) }
  end

  def self.render(content, metadata, urls)
    content = content.delete_prefix("\uFEFF")
    raise "Source Markdown is empty: #{metadata['source_url']}" if content.strip.empty?
    heading = /\A# ([^\r\n]+)\r?\n/.match(content)
    content = content[heading.end(0)..] if heading && heading[1].strip == metadata["title"]
    document = Kramdown::Document.new(content, input: "GFM", hard_wrap: false,
      gfm_quirks: "paragraph_end", syntax_highlighter: "rouge",
      syntax_highlighter_opts: { default_lang: "plaintext" })
    rewrite_links(document.root, metadata["source_url"], urls)
    MARKER + document.to_html
  end

  def self.generate(document_dir: DOCUMENTS, output_dir: OUTPUT, fetcher: method(:fetch))
    sources = documents(document_dir)
    urls = sources.to_h do |relative, metadata|
      url = metadata["permalink"] || "/docs/#{relative.delete_suffix('.md')}/"
      raise "Unsafe permalink in #{relative}: #{url}" unless url.is_a?(String) && url.match?(%r{\A/[\w/.\-]+\z})
      [metadata["source_url"], url]
    end
    generated = sources.to_h do |relative, metadata|
      [File.join(output_dir, relative), render(fetcher.call(metadata["source_url"]), metadata, urls)]
    end

    existing = Dir.glob(File.join(output_dir, "**", "*.md"))
    (existing | generated.keys).each do |path|
      next unless File.exist?(path) || File.symlink?(path)
      if File.symlink?(path) || !File.file?(path) || !File.read(path, encoding: "UTF-8").start_with?(MARKER)
        raise "Refusing to overwrite or remove non-generated file: #{path}"
      end
    end

    generated.each do |path, content|
      FileUtils.mkdir_p(File.dirname(path))
      File.write(path, content, encoding: "UTF-8")
    end
    (existing - generated.keys).each { |path| File.delete(path) }
  end
end

SourceMarkdown.generate if $PROGRAM_NAME == __FILE__
