[CmdletBinding(SupportsShouldProcess)]
param(
    [ValidateRange(1, 11)]
    [int] $TeamNumber,

    [datetime] $Date = (Get-Date)
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

if (-not $PSBoundParameters.ContainsKey("TeamNumber")) {
    Write-Host "対戦相手を選択してください。"
    foreach ($team in $teams) {
        Write-Host "$($team.Number). $($team.Name)"
    }

    $selectionText = Read-Host "番号を入力してください"
    if (-not [int]::TryParse($selectionText, [ref] $TeamNumber) -or
        $TeamNumber -lt 1 -or $TeamNumber -gt $teams.Count) {
        throw "1から$($teams.Count)までの番号を入力してください。"
    }
}

$team = $teams[$TeamNumber - 1]
$repositoryRoot = Split-Path -Parent $PSScriptRoot
$draftsDirectory = Join-Path $repositoryRoot "_drafts"
$dateText = $Date.ToString("yyyy-MM-dd")
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
---
"@

if ($PSCmdlet.ShouldProcess($draftPath, "野球観戦用の下書きを作成")) {
    [IO.File]::WriteAllText($draftPath, $content, [Text.UTF8Encoding]::new($false))
    Write-Host "下書きを作成しました: $draftPath"
}