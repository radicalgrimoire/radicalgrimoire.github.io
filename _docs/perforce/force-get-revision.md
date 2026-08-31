---
title: "サーバー上のリビジョンで復元する"
layout: page
order: 110
categories: [perforce, p4v]
permalink: /1-perforce/110-force-get-revision/
---

> [!NOTE]
> 1. 自分のPCローカルにあるファイルが何かが原因で紛失／消失した
> 2. 現在編集中のファイル を 元に戻す のが面倒で、 perforceサーバー上のファイルで戻したい

# 戻したいファイルがある大元のフォルダの選択

* 戻したいファイルの大元のフォルダを選択している状態で右クリック 
* GetRevisionを押す

{% include image.html src="/assets/docs/perforce/force-get-revision/01_ForceOperation01.png" alt="Get Revision の操作" %}

# Optionsの設定にチェックをつける

* Force Operationにチェックをつけて、Get Revisionを押す

{% include image.html src="/assets/docs/perforce/force-get-revision/01_ForceOperation02.png" alt="Force Operation の設定" %}