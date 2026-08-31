---
title: "shelve に起因するロックを解除する"
layout: page
order: 830
categories: [perforce, administrator, recovery, lock, shelve]
permalink: /1-perforce/830-unlock-shelved-file/
---

他人がチェックアウトしたファイルを強制的に解除します。
作業はサーバー管理者権限を持つユーザーしかできません

※super権限を持つPerforceユーザーアカウントの事です

## p4 loginする

```
$ p4 -u ueno.s login
Enter password: ***********

User ueno.s logged in.
```

## ロックの確認をする

ロックを取得しているユーザーが、  
どのワークスペースでロックを確保しているのか？を確認する

編集中のファイルを探すP4コマンド

```
p4 -u [super権限を持つperforceアカウント] -p [server:port] opened -a //...
```

このコマンドを実行することで、編集中のファイルが一覧として出力される


## ロックを解除する

```
p4 -u [super権限を持つperforceアカウント] -p [server:port] revert -C [ロックを確保したままのワークスペース名] [ロックが確保されたファイルのdepot上でのパス]
```

### フォルダ以下を指定して一括解除もできる

`...` を使う事で、フォルダ以下を指定して一括解除もできる

```
p4 -u super -p server:port revert -C fuga_mypc_workspace_3342 //TestDepot/mainlne/...
```

コマンド最後のファイル名指定から`...`に変える事でフォルダ指定ができます。


# tips. shelveの解除失敗によるファイルロック

shelveの解除操作をする際に、
通信不良でコマンド結果が最後まで行われなかった場合。

誰からも触る事ができないファイルロックの状態になってしまいます。

その場合は下記コマンドを使って解除しましょう

```
p4 -u super -c workspace_client unlock -xf //TestDepot/mainlne/hoge.txt
```

> 参考
> https://kb.toyo.co.jp/wiki/pages/viewpage.action?pageId=17475859