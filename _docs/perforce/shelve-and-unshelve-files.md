---
title: "Shelve でファイルを共有する"
layout: page
order: 80
categories: [perforce, p4v]
permalink: /1-perforce/080-shelve/
---

> [!NOTE]
> Perforceではサブミットをしないで、他の人にファイルを共有する事が可能です  
> その機能の事を `Shelve` と言います  

# チェックアウト

Shelveをするには、まずチェックアウトをします

{% include image.html src="/assets/docs/perforce/shelve-and-unshelve-files/01_Shelve01.png" alt="Shelve 前のチェックアウト操作" %}

defaultではなく、Newを選びましょう  
Shelveでファイルを共有するには、共有する相手から見えるようにチェンジリストに番号を割り振っておく必要があります

{% include image.html src="/assets/docs/perforce/shelve-and-unshelve-files/01_Shelve02.png" alt="新しいチェンジリストの作成" %}


# Shelve する

チェンジリストを選択して、`Shelve Files...` を選択

{% include image.html src="/assets/docs/perforce/shelve-and-unshelve-files/01_Shelve03.png" alt="Shelve Files の選択" %}

２つチェックが入ってると思いますが、そのまま気にせずShelveを実行します  
※もし入ってなかったら入れてください

{% include image.html src="/assets/docs/perforce/shelve-and-unshelve-files/01_Shelve04.png" alt="Shelve の設定画面" %}

# Unshelve する

共有相手から、教えてもらったチェンジリストの番号を探して、Shelve状態のファイルがちゃんとある事を確認します  
そして、`Unshelve files...` を選択します  

{% include image.html src="/assets/docs/perforce/shelve-and-unshelve-files/01_Shelve06.png" alt="Unshelve Files の選択" %}

Overwrite...~にチェックを入れて、Unshelveを選択します

{% include image.html src="/assets/docs/perforce/shelve-and-unshelve-files/01_Shelve07.png" alt="Unshelve の設定画面" %}

自分のローカルにShelve状態のファイルが落ちてきます。

## 他の人が現在作業中のチェンジリストを確認するには？

UserとWorkSpaceの項目を空欄にしましょう

{% include image.html src="/assets/docs/perforce/shelve-and-unshelve-files/01_Shelve08.png" alt="Shelve されたチェンジリストの確認" %}


# ファイルの共有（Shelve）が終わったら…

Delete Shelved... を選択して、ファイルの共有状態を解除します

{% include image.html src="/assets/docs/perforce/shelve-and-unshelve-files/01_Shelve05.png" alt="Delete Shelved の操作" %}

共有状態も無くしたチェンジリストは削除しておきましょう。