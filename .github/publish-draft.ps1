[CmdletBinding(SupportsShouldProcess)]
param(
    [Parameter(Position = 0)]
    [string] $Path,

    [Parameter(Position = 1)]
    [datetime] $Date = (Get-Date)
)

$ErrorActionPreference = "Stop"

$repositoryRoot = Split-Path -Parent $PSScriptRoot
$draftsDirectory = Join-Path $repositoryRoot "_drafts"
$postsDirectory = Join-Path $repositoryRoot "_posts"

if ([string]::IsNullOrWhiteSpace($Path)) {
    $drafts = @(Get-ChildItem -LiteralPath $draftsDirectory -Filter "*.md" -File | Sort-Object Name)
    if ($drafts.Count -eq 0) {
        Write-Host "公開できる下書きはありません。"
        return
    }

    for ($index = 0; $index -lt $drafts.Count; $index++) {
        Write-Host "$($index + 1). $($drafts[$index].Name)"
    }

    $selectionText = Read-Host "公開する記事の番号を入力してください"
    $selection = 0
    if (-not [int]::TryParse($selectionText, [ref] $selection) -or
        $selection -lt 1 -or $selection -gt $drafts.Count) {
        throw "1から$($drafts.Count)までの番号を入力してください。"
    }

    $Path = $drafts[$selection - 1].FullName
}

$sourceCandidate = if ([IO.Path]::IsPathRooted($Path)) {
    $Path
} else {
    Join-Path $repositoryRoot $Path
}
$sourcePath = (Resolve-Path -LiteralPath $sourceCandidate).Path

if ([IO.Path]::GetExtension($sourcePath) -ne ".md") {
    throw "Markdownファイルを指定してください: $sourcePath"
}

if ([IO.Path]::GetDirectoryName($sourcePath) -ne $draftsDirectory) {
    throw "_drafts直下のファイルを指定してください: $sourcePath"
}

$slug = [IO.Path]::GetFileNameWithoutExtension($sourcePath) -replace '^\d{4}-\d{2}-\d{2}-', ''
if ([string]::IsNullOrWhiteSpace($slug)) {
    throw "記事名を判別できません: $sourcePath"
}

$dateText = $Date.ToString("yyyy-MM-dd")
$destinationPath = Join-Path $postsDirectory "$dateText-$slug.md"
if (Test-Path $destinationPath) {
    throw "公開先がすでに存在します: $destinationPath"
}

$content = [IO.File]::ReadAllText($sourcePath)
$newline = if ($content.Contains("`r`n")) { "`r`n" } else { "`n" }
if ($content -notmatch "\A---\r?\n") {
    throw "Front Matterが見つかりません: $sourcePath"
}

$frontMatterEnd = $content.IndexOf("${newline}---${newline}", 4)
if ($frontMatterEnd -lt 0) {
    throw "Front Matterの終端が見つかりません: $sourcePath"
}

$frontMatter = $content.Substring(0, $frontMatterEnd)
if ($frontMatter -match '(?m)^date:\s*.*$') {
    $updatedFrontMatter = $frontMatter -replace '(?m)^date:\s*.*$', "date: $dateText"
} else {
    $updatedFrontMatter = "$frontMatter${newline}date: $dateText"
}

$body = $content.Substring($frontMatterEnd)
$bodyLines = [regex]::Split($body, '\r?\n')
$insideCodeFence = $false
for ($index = 0; $index -lt $bodyLines.Count; $index++) {
    $line = $bodyLines[$index]

    if ($line -match ' {1}$' -and $line -notmatch ' {2,}$') {
        $line = $line.Substring(0, $line.Length - 1)
        $bodyLines[$index] = $line
    }

    if ($line -match '^\s*(```|~~~)') {
        $insideCodeFence = -not $insideCodeFence
        continue
    }

    if ($insideCodeFence -or [string]::IsNullOrWhiteSpace($line)) {
        continue
    }

    $isMarkdownStructure = $line -match '^\s{0,3}(#{1,6}\s|[-*+]\s|\d+[.)]\s|>|<!--|-->|---\s*$|\*\*\*\s*$|___\s*$)' -or
        $line -match '^\s*\|' -or $line -match '^\s{4,}\S'
    if (-not $isMarkdownStructure -and $line -notmatch ' {2,}$') {
        $line += '  '
    }

    $bodyLines[$index] = $line
}

$updatedBody = $bodyLines -join $newline
$updatedContent = $updatedFrontMatter + $updatedBody

if ($PSCmdlet.ShouldProcess($destinationPath, "下書きを公開")) {
    [IO.File]::WriteAllText($destinationPath, $updatedContent, [Text.UTF8Encoding]::new($false))
    Remove-Item -LiteralPath $sourcePath
    Write-Host "公開しました: $destinationPath"
}