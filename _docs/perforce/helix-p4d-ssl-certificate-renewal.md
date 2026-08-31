---
title: "helix-p4d SSL 証明書更新手順"
layout: page
order: 260
categories: [perforce, administrator, ssl, certificate]
permalink: /1-perforce/260-ssl-certificate-renewal/
---

# helix-p4d SSL 証明書更新手順

## 概要

Helix Core（p4d）が使用する SSL 証明書の有効期限の更新方法

### 作業によって発生する事

* helix-proxyなど関連サービスを使っている場合は同時にサービスを落とす
* サーバー再起動が必要になる（コンテナ再起動）
* P4Vなどtrust this finger print の再認証をしなければならない

## サーバで調べる内容

- P4PORT：ssl:1666  
- P4ROOT：/opt/perforce/servers/master  
- P4SSLDIR：/opt/perforce/servers/master/root/ssl  

## 証明書期限の確認

```
p4 -Ztag info | grep serverCertExpires
```

例：

```
... serverCertExpires Apr 30 04:04:12 2026 GMT
```

# 作業手順（サーバ管理者）

## 1. 既存証明書の退避

```
mv /opt/perforce/servers/master/root/ssl /tmp/
mkdir /opt/perforce/servers/master/root/ssl
chmod 700 /opt/perforce/servers/master/root/ssl
```

## 2. 証明書の再生成

```
su - perforce
p4d -r /opt/perforce/servers/master/root/ -Gc
```

## 3. 証明書ファイルの確認

```
ls -l /opt/perforce/servers/master/root/ssl/certificate.txt
ls -l /opt/perforce/servers/master/root/ssl/privatekey.txt
```

## 4. p4d の起動
コンテナを再起動し、p4d を再起動する。

## 5. サーバ側の動作確認

```
p4 -p ssl:1666 -Ztag info
```

証明書期限が更新されていることを確認する

---

# クライアント側作業（周知事項）

## CLI

```
p4 -p ssl:1666 trust -f
```

## P4V
初回接続時にフィンガープリント確認ダイアログが表示されるため、  
「このフィンガープリントを信用する」を選択して接続する。

---

# チェック項目（サーバ管理者）

- [ ] p4d が正常に起動している  
- [ ] `p4 info` で新しい証明書期限が反映されている  
- [ ] CI / Swarm / Proxy など外形監視が正常  
- [ ] クライアント側 trust 更新の周知を実施  

---

# 備考
- 証明書生成に失敗した場合、p4d は起動しないため即時対応が必要  
- 証明書更新後はクライアント側でフィンガープリント更新が必須  