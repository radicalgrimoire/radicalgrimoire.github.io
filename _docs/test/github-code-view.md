---
title: "GitHub Code View"
layout: page
categories: [test]
---

公開リポジトリのファイルを、特定コミットに固定して表示します。行番号をクリックすると行へのリンクを作成し、Shift を押しながら別の行番号をクリックすると範囲を選択できます。`wrap=true`を指定すると長い行を折り返し、指定しない場合は横スクロールします。

{% include github-code-view.html
  id="code-view-demo"
  repo="radicalgrimoire/radicalgrimoire.github.io"
  commit="54962802dbbe574bc2c2cf2caba3f7f83b8a8451"
  wrap="true"
  path="_includes/embed.html"
  start=1
  end=3
%}

この表示はブラウザで GitHub の raw URL を取得します。対象は公開リポジトリに限られ、`commit` にはブランチ名ではなく完全なコミットSHAを指定します。