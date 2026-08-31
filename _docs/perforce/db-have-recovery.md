---
title: "db.have の復旧"
layout: page
order: 810
categories: [perforce, administrator, recovery, troubleshooting]
permalink: /1-perforce/810-db-have-recovery/
---

# ある日起こった事

error で ワークスペースに関する操作ができなくなった  

{% include image.html src="/assets/docs/perforce/db-have-recovery/01_db-have-recovery-01.png" alt="db.have 破損時のエラー画面" %}

ベンダー会社に問い合わせた所、  
「エラーの内容の通りdb.haveが破損していると思われる」との回答

# helix-p4dサーバー本体にアクセスする

```
# perforce ユーザーに変更
su perforce

# helix-p4d の停止
p4 admin stop 
```

# db.have をリネームしてバックアップを取る

```
mv db.have db.have.backup
```

# 復旧コマンドを実行する

```
p4d -r /opt/perforce/servers/master/root/ -xf 43361
```
このコマンド実行することで、db.haveが復旧するらしい

# P4V でSyncする

復旧コマンドでdb.haveは確かに戻るんだけど、  
「そのワークスペースで、どこまでのCLを取得したのか？」の情報が復旧されないので…  
P4Vで必ずSyncする必要がある  
  
（ベンダーからも手順の最後でSyncするとの手順案内があった）