[CmdletBinding(SupportsShouldProcess)]
param(
    [int] $Year,

    [int] $Month,

    [int] $Day,

    [int] $TeamNumber
)

$ErrorActionPreference = "Stop"

$teams = @(
    [pscustomobject]@{ Number = 1; Name = "阪神タイガース"; Slug = "tigers" }
    [pscustomobject]@{ Number = 2; Name = "中日ドラゴンズ"; Slug = "dragons" }
    [pscustomobject]@{ Number = 3; Name = "横浜DeNAベイスターズ"; Slug = "baystars" }
    [pscustomobject]@{ Number = 4; Name = "東京ヤクルトスワローズ"; Slug = "swallows" }
    [pscustomobject]@{ Number = 5; Name = "広島東洋カープ"; Slug = "carp" }
    [pscustomobject]@{ Number = 6; Name = "埼玉西武ライオンズ"; Slug = "lions" }
    [pscustomobject]@{ Number = 7; Name = "北海道日本ハムファイターズ"; Slug = "fighters" }
    [pscustomobject]@{ Number = 8; Name = "千葉ロッテマリーンズ"; Slug = "marines" }
    [pscustomobject]@{ Number = 9; Name = "オリックス・バファローズ"; Slug = "buffaloes" }
    [pscustomobject]@{ Number = 10; Name = "東北楽天ゴールデンイーグルス"; Slug = "eagles" }
    [pscustomobject]@{ Number = 11; Name = "福岡ソフトバンクホークス"; Slug = "hawks" }
)

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
    $Year = Read-Number -Prompt "観戦する年を入力してください" -Minimum 2000 -Maximum 9999
}

if (-not $PSBoundParameters.ContainsKey("Month")) {
    $Month = Read-Number -Prompt "観戦する月を入力してください" -Minimum 1 -Maximum 12
}

if (-not $PSBoundParameters.ContainsKey("Day")) {
    $Day = Read-Number -Prompt "観戦する日を入力してください" -Minimum 1 -Maximum 31
}

if (-not $PSBoundParameters.ContainsKey("TeamNumber")) {
    Write-Host "対戦相手を選択してください。"
    foreach ($team in $teams) {
        Write-Host "$($team.Number). $($team.Name)"
    }

    $TeamNumber = Read-Number -Prompt "番号を入力してください" -Minimum 1 -Maximum $teams.Count
}

$gameDate = $null
try {
    $gameDate = [datetime]::new($Year, $Month, $Day)
} catch {
    throw "有効な観戦日を入力してください: $Year-$Month-$Day"
}

if ($TeamNumber -lt 1 -or $TeamNumber -gt $teams.Count) {
    throw "1から$($teams.Count)までの番号を入力してください。"
}

$team = $teams[$TeamNumber - 1]
$repositoryRoot = Split-Path -Parent $PSScriptRoot
$draftsDirectory = Join-Path $repositoryRoot "_drafts"
$dateText = $gameDate.ToString("yyyy-MM-dd")
$draftPath = Join-Path $draftsDirectory "$dateText-vs-$($team.Slug).md"

if (Test-Path -LiteralPath $draftPath) {
    throw "同じ日付・対戦相手の下書きがすでに存在します: $draftPath"
}

$content = @"
---
title: "vs$($team.Name) 第 回戦"
layout: post
categories: ["baseball"]
tags: ["giants"]
date: $dateText
---
"@

if ($PSCmdlet.ShouldProcess($draftPath, "野球観戦用の下書きを作成")) {
    [IO.File]::WriteAllText($draftPath, $content, [Text.UTF8Encoding]::new($false))
    Write-Host "下書きを作成しました: $draftPath"
}