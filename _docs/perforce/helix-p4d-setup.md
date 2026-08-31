---
title: "Helix p4d のコンテナ構築"
layout: page
order: 210
categories: [perforce, administrator, p4d, docker]
permalink: /1-perforce/210-helix-p4d-setup/
---

# 構築について

https://www.perforce.com/manuals/p4sag/Content/P4SAG/install.linux.packages.install.html

このリンクにある手順通りにインストールを進めれば構築できるが  
ここではコンテナで構築する際に工夫した事を記載する  

リポジトリ: https://github.com/radicalgrimoire/docker-helixcore

# インストール後の構成

> /opt/perforce/sbin/configure-helix-p4d.sh

インストールをした後、実際のhelix-p4dサーバーを構築するには  
このスクリプトを実行する必要がある

コンテナを起動したらすぐに設定済みの構築ができるようにしたかったので  
Dockerfileのビルド時に `init.sh` を実行し、サーバーの初期セットアップを済ませる構成にした

```sh
# init.sh の中で呼び出している
/opt/perforce/sbin/configure-helix-p4d.sh $P4NAME -n -p $P4PORT -r $P4ROOT \
  -u $P4USER -P $P4PASSWD --case $CASE_INSENSITIVE --unicode
```

`-n` フラグで非対話モードにすることで、ビルド中に入力待ちが発生しないようにしている

`--unicode` を指定することで日本語ファイル名に対応させている

# 工夫した点

## ARG/ENV で設定を外部化

サーバー名・ポート・ユーザー・パスワード・ルートパス・ケース設定をすべて `ARG`/`ENV` で受け取る構成にした  
`docker-compose.yml` の `environment` で値を変えるだけで異なる環境に対応できる

```dockerfile
ARG P4NAME
ARG P4PORT
ARG P4USER
ARG P4PASSWD
ARG P4HOME
ARG P4ROOT
ARG CASE_INSENSITIVE
```

## init.sh の冪等性

`init.sh` の冒頭で `p4dctl list` を使って既にサーバーが存在するか確認し  
存在する場合はセットアップをスキップするようにした

```sh
if ! p4dctl list 2>/dev/null | grep -q $P4NAME; then
  # セットアップ処理
fi
```

これによりコンテナを再起動しても二重初期化が起きない

## SSL証明書の自動信頼

SSL接続時に初回の `p4 trust` を手動でやる必要があるが  
init.sh と run.sh の両方で自動的に実行するようにした

```sh
p4 trust -y -f
```

`-f` を付けることで既存のtrust情報を強制上書きする

## keepalive の設定

長時間接続が切れる問題を防ぐためにkeepAliveを設定している

```sh
p4 configure set net.keepalive.idle=10
p4 configure set net.keepalive.interval=30
p4 configure set net.keepalive.count=3
```

## 未署名拡張機能の許可

helix-authentication-extension を利用するために  
未署名の拡張機能を許可する設定を入れている

```sh
p4 configure set server.extensions.allow.unsigned=1
```

## .p4config をperforceユーザーに自動作成

perforceユーザーが p4 コマンドを実行する際に毎回オプション指定が不要になるよう  
ホームディレクトリに `.p4config` を自動生成している

```sh
cat > ~perforce/.p4config <<EOF
P4USER=$P4USER
P4PORT=$P4PORT
P4PASSWD=$P4PASSWD
EOF
chmod 0600 ~perforce/.p4config
chown perforce:perforce ~perforce/.p4config
```

## .p4trust と .p4tickets の引き継ぎ

rootで実行した `p4 trust` / `p4 login` の結果を  
perforceユーザーにもコピーすることでトリガーが正常に動作するようにした

```sh
cp /root/.p4trust /opt/perforce/.p4trust
cp /root/.p4tickets /opt/perforce/.p4tickets
chown perforce:perforce /opt/perforce/.p4trust
chown perforce:perforce /opt/perforce/.p4tickets
```

## ケース一貫性チェックトリガーの自動登録

大文字小文字の混在によるファイル名の競合を防ぐため  
`CheckCaseTrigger3.py` をビルド時に組み込み、init.sh でトリガーとして自動登録する

```sh
p4 triggers -o > triggers.txt
echo '   CheckCaseTrigger change-submit //... "python3 /usr/local/bin/CheckCaseTrigger3.py %changelist% port=ssl:1666 user=super"' >> triggers.txt
p4 triggers -i < triggers.txt
```

## admin.txt をinit後に削除

管理者グループ設定に使った `admin.txt` にはユーザー情報が含まれるため  
`p4 group -i` で取り込んだ後に即削除している

```sh
p4 -p $P4PORT group -i < /opt/perforce/admin.txt
rm -f /opt/perforce/admin.txt
```

## run.sh でコンテナをフォアグラウンドに保つ

DockerコンテナはCMDプロセスが終了すると停止するため  
`tail` でp4dのログを追いながらp4dのPIDが生きている間だけプロセスを続けるようにした

```sh
exec /usr/bin/tail --pid=$(cat /var/run/p4d.$P4NAME.pid) -F "$P4ROOT/logs/log"
```

`exec` を使うことで tail がPID 1になり、シグナルも正しく受け取れる

## ヘルスチェック

コンテナのヘルスチェックとして `p4 info -s` をSSL接続で定期実行している

```dockerfile
HEALTHCHECK \
    --interval=2m \
    --timeout=30s \
    CMD p4 -p ssl:1666 info -s > /dev/null || exit 1
```

## gitのビルド後削除

helix-authentication-extensionを取得するために `git` をインストールするが  
取得後は不要なのでイメージ軽量化のために削除している

```dockerfile
&& git clone https://github.com/perforce/helix-authentication-extension.git /opt/helix-authentication-extension \
&& apt-get remove -y git \
&& apt-get autoremove -y \
&& apt-get clean \
&& rm -rf /var/lib/apt/lists/*
```