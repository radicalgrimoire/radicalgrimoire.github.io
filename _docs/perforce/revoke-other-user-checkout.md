---
title: "他ユーザーのチェックアウトを解除する"
layout: page
order: 820
categories: [perforce, administrator, recovery, lock]
permalink: /1-perforce/820-revoke-other-user-checkout/
---

> [!NOTE]
> 他人がチェックアウトしたファイルを強制的に解除します  
> superレベルのユーザーアカウントを持つ人が作業を行いましょう
> 
> https://kb.toyo.co.jp/wiki/pages/viewpage.action?pageId=17475859

# ■ ファイルのチェックアウト状況の確認

チェックアウトしているユーザーが、  
どのワークスペースでロックを確保しているのか？を確認する

```
p4 -u <perforceアカウント> -p <server:port> opened -a //...
```

# ■ ロックを解除する

```
p4 -u <perforceアカウント> -p [server:port] revert -C [ワークスペース名] [ロックされているファイルのdepot上でのパス]
```

## フォルダ以下を指定して一括解除もできる

`...` を使う事で、フォルダ以下を指定して一括解除もできる

```
p4 -u super -p server:port revert -C fuga_mypc_workspace_3342 //TestDepot/mainlne/...
```

# ■ tips. shelveの解除失敗によるファイルロック

shelveの解除操作をする際に、
通信不良でコマンド結果が最後まで行われなかった場合。

誰からも触る事ができないファイルロックの状態になってしまいます。

その場合は下記コマンドを使って解除しましょう

```
p4 -u super -c workspace_client unlock -xf //TestDepot/mainlne/hoge.txt
```