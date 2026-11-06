require "json"
require "open3"
require "time"

def git(*args)
  output, error, status = Open3.capture3("git", *args)
  abort "git #{args.first} failed: #{error.strip}" unless status.success?
  output
end

abort "A complete Git history is required; fetch the full history first." if
  git("rev-parse", "--is-shallow-repository").strip == "true"

paths = git("ls-files", "-z", "--", "_docs", "_posts").split("\0")
updates = paths.filter_map do |path|
  next unless File.file?(path)

  timestamp = git("log", "-1", "--follow", "--format=%cI", "--", path).strip
  abort "No Git history found for #{path}" if timestamp.empty?

  { "path" => path, "updated_at" => timestamp }
end
updates.sort_by! { |update| [-Time.iso8601(update.fetch("updated_at")).to_i, update.fetch("path")] }

File.write("_data/recent_updates.json", JSON.pretty_generate(updates) + "\n")
