require "fileutils"
require "net/http"
require "uri"
require "yaml"

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
      [relative, metadata["source_url"]]
    end
  end

  def self.render(content, url)
    heading = /\A# ([^\r\n]+)\r?\n/.match(content)
    raise "Source Markdown must start with a non-empty level-one heading: #{url}" unless heading && !heading[1].strip.empty?

    MARKER + content[heading.end(0)..]
  end

  def self.generate(document_dir: DOCUMENTS, output_dir: OUTPUT, fetcher: method(:fetch))
    generated = documents(document_dir).to_h do |relative, url|
      [File.join(output_dir, relative), render(fetcher.call(url), url)]
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
