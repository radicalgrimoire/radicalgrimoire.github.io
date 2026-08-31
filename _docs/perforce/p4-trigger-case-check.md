---
title: "大文字・小文字チェック用トリガー"
layout: page
order: 240
categories: [perforce, administrator, trigger]
permalink: /1-perforce/240-trigger-case-check/
---

# 東陽テクニカのFAQ

大文字／小文字を「区別しない」に変更したい  
https://kb.toyo.co.jp/wiki/pages/viewpage.action?pageId=45482680

p4pythonのインストールは今はパッケージインストールが可能になってます。

# 必要なパッケージのインストール

ubuntu
```
apt-get -y install python3 perforce-p4python3 python3-distutils
```


# トリガー内容

p4 triggers を実行して、
```
CheckCaseTrigger change-submit //... "python3 /usr/local/bin/CheckCaseTrigger3.py %changelist% port=ssl:1666 user=super"
```
これを記述して設定完了

# perforceユーザーでログインしておく

トリガー内容を実行するのはperforceユーザーが実行する事になるので、
予めログインしておく

```
p4 login
p4 trust -y -f
```
これでOK