[CmdletBinding(SupportsShouldProcess)]
param(
    [int] $Year,

    [int] $Month,

    [int] $Day
)

$ErrorActionPreference = "Stop"

function Read-Number {
    param(
        [string] $Prompt,
        [int] $Minimum,
        [int] $Maximum
    )

    $inputText = Read-Host $Prompt
    $number = 0
    if (-not [int]::TryParse($inputText, [ref] $number) -or $number -lt $Minimum -or $number -gt $Maximum) {
        throw "$Minimumから$Maximumまでの数字を入力してください。"
    }

    return $number
}

if (-not $PSBoundParameters.ContainsKey("Year")) {
    $Year = Read-Number -Prompt "記事の日付の年を入力してください" -Minimum 2000 -Maximum 9999
}

if (-not $PSBoundParameters.ContainsKey("Month")) {
    $Month = Read-Number -Prompt "記事の日付の月を入力してください" -Minimum 1 -Maximum 12
}

if (-not $PSBoundParameters.ContainsKey("Day")) {
    $Day = Read-Number -Prompt "記事の日付の日を入力してください" -Minimum 1 -Maximum 31
}

try {
    $articleDate = [datetime]::new($Year, $Month, $Day)
} catch {
    throw "有効な記事の日付を入力してください: $Year-$Month-$Day"
}

$repositoryRoot = Split-Path -Parent $PSScriptRoot
$draftsDirectory = Join-Path $repositoryRoot "_drafts"
$dateText = $articleDate.ToString("yyyy-MM-dd")
$draftPath = Join-Path $draftsDirectory "$dateText-draft.md"

if (Test-Path -LiteralPath $draftPath) {
    throw "同じ日付の下書きがすでに存在します: $draftPath"
}

$content = @"
---
title: "タイトル"
layout: post
categories: ["blog"]
tags: []
date: $dateText
---
"@

if ($PSCmdlet.ShouldProcess($draftPath, "通常記事用の下書きを作成")) {
    [IO.File]::WriteAllText($draftPath, $content, [Text.UTF8Encoding]::new($false))
    Write-Host "下書きを作成しました: $draftPath"
}