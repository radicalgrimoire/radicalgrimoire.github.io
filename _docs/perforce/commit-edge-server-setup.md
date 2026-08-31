---
title: "P4 Server コミット/エッジサーバー構成"
layout: page
order: 220
categories: [perforce, administrator, commit-edge]
permalink: /1-perforce/220-commit-edge-server/
---

# P4 Server コミット/エッジサーバー構成

コミット/エッジ構成は、コミットサーバー1台と1台以上のエッジサーバーで構成する分散モデルです。地理的に離れた利用者をエッジサーバーへ接続し、提出前の処理をエッジで受けることで、コミットサーバーの負荷と待ち時間を抑える用途に向きます。

この文書は、既存の単一 P4 Server をコミットサーバーに移行し、エッジサーバーを1台追加する場合の手順です。2026-07-31 時点の [P4 Server Administrator Guide](https://help.perforce.com/helix-core/server-apps/p4sag/current/Content/P4SAG/commit-edge-setting-up.html) を基にしています。実施前に、利用する p4d リリースの公式ドキュメントを必ず確認してください。

この手順は SSL/TLS を使う構成を前提としています。SSL/TLS を使わない構成には対応していません。

## 構成と用語

| 用語 | 役割 |
| --- | --- |
| コミットサーバー | 全体の中核となるサーバー。エッジサーバーを含む構成を定義し、変更の最終的なコミット先になる。 |
| エッジサーバー | クライアントのワークスペース・作業中データを局所的に扱い、メタデータと versioned files をコミットサーバーから複製するサーバー。 |
| サーバー ID | `p4 server` で作成する構成を識別する値。コミット側で作成し、各 p4d に設定する。 |
| サービスユーザー | サーバー間認証だけに使う `Type: service` のユーザー。通常の利用者アカウントとして使わない。 |

コミット/エッジ構成はバックアップや運用を不要にする仕組みではありません。各エッジサーバーには固有のワークスペース・作業中データがあり、利用者の作業を保持するエッジは個別にバックアップ計画が必要です。

## 作業前の確認

作業には `super` 権限が必要です。変更前に、コミットサーバーの有効なチェックポイント、ジャーナル、versioned files のバックアップと復元手順を確認してください。

次の条件を満たす必要があります。

* エッジサーバーはコミットサーバーと同じリリース版で、リリースレベルはコミットサーバーと同等以上である。
* Unicode 設定・エンコーディング、ファイルシステムの大文字小文字の扱い、許容文字、タイムゾーンを一致させる。
* コミットとエッジの間で、クライアント用とは別でもよいサーバー間通信経路を確保する。
* `P4ROOT`、`P4PORT`、`P4SSLDIR`、ログ、チェックポイントとジャーナルの保存先をサーバーごとに決める。
* `P4TARGET` には、エッジから到達できるコミットサーバーの正しいプロトコル・ホスト名・ポートを指定する。

SSL/TLS を使う場合、エッジには自身の証明書と秘密鍵に加え、コミットサーバーを信頼する `P4TRUST` が必要です。利用者もエッジサーバーのフィンガープリントを信頼する必要があります。

## 1. サービスユーザーを作成する

コミットサーバー側で、コミット用とエッジ用にそれぞれ固有の `service` ユーザーを作成します。サービスユーザーはライセンスを消費せず、サーバー間認証に使われます。

```sh
p4 -u super user -f commit-service
p4 -u super user -f edge-service
```

開いたユーザー仕様で、それぞれ `Type: service` を設定します。強いパスワードを設定します。

```sh
p4 -u super passwd commit-service
p4 -u super passwd edge-service
```

サービスユーザーは専用グループに入れます。2025.2 以降では service ユーザーのチケットは既定で無期限です。2025.1 以前では、`Timeout:` と `PasswordTimeout:` を `unlimited` にして、チケット期限で複製が停止しないようにします。

```text
Group: serviceusergroup
Timeout: unlimited
PasswordTimeout: unlimited
Users:
	commit-service
	edge-service
```

複製を正常に動作させるため、公式手順に従いサービスユーザーグループへ `super` 権限を付与します。これは通常の利用者をこのグループへ入れないことが前提です。既存の保護テーブルを確認し、既存ルールを消さずに追記します。

```text
Protections:
	super group serviceusergroup * //...
```

## 2. コミットサーバーを構成する

既存サーバーにコミットサーバー用のサーバー仕様を作成し、その ID を設定します。`Services: commit-server` を保存するとデータベースのアップグレードが発生する場合があるため、保守時間中にバックアップを取得して実施します。

```sh
p4 server -c commit-server tokyo_commit
p4 serverid tokyo_commit
```

この例では、`tokyo_commit` というコミットサーバーの仕様を作成し、現在の p4d にそのサーバー ID を設定します。

`DistributedConfig:` には少なくとも次を環境に合わせて設定します。

```text
DistributedConfig:
	serviceUser=commit-service
	monitor=2
	journalPrefix=/srv/perforce/commit/checkpoints/p4_
	P4TICKETS=/srv/perforce/commit/root/.p4tickets
	P4LOG=/srv/perforce/commit/logs/p4d.log
	P4TRUST=/srv/perforce/commit/root/.p4trust
```

この例では、`P4ROOT` に `/srv/perforce/commit/root`、チェックポイントとローテーション済みジャーナルに `/srv/perforce/commit/checkpoints/`、p4d のログに `/srv/perforce/commit/logs/p4d.log` を使います。

マルチサーバー構成では、公式手順はチケット認証を必須にする `security=4` を案内しています。これは全体の認証動作に影響するため、既存のクライアント・自動処理への影響を確認してから設定します。

```sh
p4 configure set security=4
```

## 3. エッジサーバー仕様を作成する

コミットサーバー上でエッジサーバーの仕様を作成します。

```sh
p4 server -c edge-server tokyo_edge
```

この例では、`tokyo_edge` というエッジサーバーの仕様を作成します。後続の `p4d -P` と `p4d -xD` にも `tokyo_edge` を指定します。

`ExternalAddress:` には、コミットサーバーからエッジへ到達する `ssl:edge-server:1666` を設定します。

`DistributedConfig:` の基準例は次のとおりです。

```text
DistributedConfig:
	db.replication=readonly
	lbr.replication=readonly
	rpl.compress=4
	startup.1=pull -i 1
	startup.2=pull -u -i 1
	startup.3=pull -u -i 1
	P4TARGET=ssl:commit-server:1666
	serviceUser=edge-service
	monitor=1
	journalPrefix=/srv/perforce/edge/checkpoints/p4_
	P4TICKETS=/srv/perforce/edge/root/.p4tickets
	P4LOG=/srv/perforce/edge/logs/p4d.log
	P4TRUST=/srv/perforce/edge/root/.p4trust
```

`startup.1` はメタデータ、`startup.2` と `startup.3` は versioned files の pull を開始します。リモート拠点では `rpl.compress=4` が推奨されます。近接した拠点では、帯域と CPU 使用率を確認して圧縮を外すこともできます。pull スレッド数や間隔は、転送量と負荷を測定して調整します。

## 4. エッジの初期データを作成する

### フィルター済みチェックポイントを作成する

エッジの初期化には、エッジ用にフィルターしたコミットサーバーのデータベースを使います。`-K` にテーブル一覧を手入力するのではなく、サーバー ID を指定する `-P tokyo_edge` を使います。

2025.1 以降では、対象バージョンで除外されるテーブルを次のコマンドで確認できます。

```sh
p4d -R edge-server -jd -l
```

コミットサーバーで、エッジ用チェックポイントを作成します。

```sh
p4d -r /srv/perforce/commit/root -P tokyo_edge -z -jd edge.ckp
```

生成された `edge.ckp.gz` をエッジサーバーへ安全に転送します。初期化にはデータベースだけでなく、コミットサーバーの versioned files も必要です。

### データベースと versioned files を配置する

エッジサーバーでチェックポイントを展開し、サーバー ID を設定します。

```sh
p4d -r /srv/perforce/edge/root -z -jr edge.ckp.gz
p4d -r /srv/perforce/edge/root -xD tokyo_edge
```

続けて、コミットサーバーの各 depot の versioned files をエッジの対応する場所へコピーします。`p4 depots` で depot 一覧を確認し、各 depot に対して `p4 depot -o <depot-name>` の `Map:` で保存先を確認してコピーします。次は `depot` という名前の depot の例です。`rsync` など、ファイル属性とディレクトリ構造を保持できる方法を使います。

```sh
rsync -avz /srv/perforce/commit/root/depot/ edge-server:/srv/perforce/edge/root/depot/
```

データ量が大きい場合は、事前コピー後に差分コピーを実行して停止時間を短くできます。

## 5. 相互認証を設定して起動する

エッジは自身の `P4SSLDIR` に証明書と秘密鍵を持たせます。そのうえで、エッジのサービスユーザーがコミットサーバーを trust してログインします。

```sh
export P4TRUST=/srv/perforce/edge/root/.p4trust
export P4TICKETS=/srv/perforce/edge/root/.p4tickets
p4 -u edge-service -p ssl:commit-server:1666 trust
p4 -u edge-service -p ssl:commit-server:1666 login
```

さらに、コミットサーバーのサービスユーザーもエッジサーバーを trust してログインします。エッジからの並列 submit や shelve では、コミット側がエッジへ接続するため、この設定が必要です。

```sh
export P4TRUST=/srv/perforce/commit/root/.p4trust
export P4TICKETS=/srv/perforce/commit/root/.p4tickets
p4 -u commit-service -p ssl:edge-server:1666 trust
p4 -u commit-service -p ssl:edge-server:1666 login
```

通常運用で使う `p4dctl`、systemd、またはコンテナのサービス管理方法でエッジを起動します。初期構築時だけ手動で `p4d -d` を使う場合も、以後の起動方法と混在させないでください。

## 6. 検証する

エッジ上で次を確認します。

```sh
p4 -p ssl:edge-server:1666 info
p4 pull -lj
```

`p4 info` の `Server services: edge-server`、および `p4 pull -lj` のメタデータ・アーカイブ pull が進行または待機状態であることを確認します。代表的なクライアントで同期、submit、shelve を実施し、コミット側への反映を確認します。

長期運用では、`p4 journaldbchecksums` と `rpl.checksum.*` の設定、整合性イベントの構造化ログ監視を有効にして、複製の破損を早期に検出します。コミットと各エッジのバックアップ・復旧を実際に演習してください。

## 運用上の制約

* `p4 unsubmit` と `p4 resubmit` はコミットサーバーに対して実行し、エッジでは実行できない。
* 排他的ロックはグローバルであり、エッジからコミットへの通信遅延の影響を受ける。
* エッジで作成した shelve は、通常は他のエッジと共有されない。必要な場合は promote を使う。
* エッジに束縛された client や changelist を削除する際は `--serverid` を指定する。
* エッジのジャーナルローテーションは直接実行せず、コミットサーバー側のローテーションに連動させる。

## トラブルシューティング

| 症状 | 確認する項目 |
| --- | --- |
| エッジが起動しない | `P4ROOT`、サーバー ID、`P4SSLDIR`、証明書・秘密鍵、ログ保存先の所有者と権限。 |
| pull が開始・進行しない | `P4TARGET`、コミットへの通信、`startup.N`、サービスユーザーの `P4TICKETS` と `P4TRUST`、コミットのローテーション済みジャーナル。 |
| submit または shelve が失敗する | エッジの `ExternalAddress`、コミット側サービスユーザーのエッジへの trust/login、コミットからエッジへの通信。 |
| 複製の整合性に問題がある | `p4 pull -lj`、P4LOG、整合性イベントの構造化ログ、`p4 journaldbchecksums` の結果。 |

## 補助スクリプト

[commit-edge の補助スクリプト](https://github.com/radicalgrimoire/radicalgrimoire/tree/main/scripts/commit-edge) には、構成前の診断と、起動後のエッジ検証を行う読み取り専用の Bash スクリプトを置いています。サーバー仕様、保護テーブル、認証情報、サービス状態を変更するスクリプトは含みません。

## 公式資料

* [Commit-edge overview](https://help.perforce.com/helix-core/server-apps/p4sag/current/Content/P4SAG/Commit-edge-overview.html)
* [Set up a commit/edge configuration](https://help.perforce.com/helix-core/server-apps/p4sag/current/Content/P4SAG/commit-edge-setting-up.html)
* [Create commit and edge server configurations](https://help.perforce.com/helix-core/server-apps/p4sag/current/Content/P4SAG/commit-edge-create-spec.html)
* [Create and start the edge servers](https://help.perforce.com/helix-core/server-apps/p4sag/current/Content/P4SAG/commit-edge-start.html)
* [Manage commit-edge installations](https://help.perforce.com/helix-core/server-apps/p4sag/current/Content/P4SAG/commit-edge-managing.html)