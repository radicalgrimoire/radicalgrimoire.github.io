---
title: "Helix Core のチェックポイントと復旧"
layout: page
order: 250
categories: [perforce, administrator, backup, recovery]
permalink: /1-perforce/250-checkpoint-backup-and-restore/
---

# Helix Core のチェックポイントと復旧

Helix Core のデータベースをチェックポイントから復旧するための運用メモです。復旧作業はサービス停止を伴い、誤った `P4ROOT` を指定すると別環境を破損させるおそれがあります。実施前にバックアップを検証し、保守時間と復旧判断者を確保してください。

## バックアップ

定期的にチェックポイントを作成し、作成日時と対象サーバー ID を分かる名前で保管します。

```sh
p4 admin checkpoint -z <checkpoint-name>
```

チェックポイントだけでは作成後の変更を復元できません。チェックポイント以降のジャーナルも同じ保管先へ退避し、復元可能か定期的に検証します。

## 復旧前の確認

* 復旧対象の `P4ROOT` と p4d のバージョンを確認する。
* 復旧するチェックポイントと、その後に適用するジャーナルを決定する。
* 現在の `P4ROOT` を別の場所へ退避する。
* p4d と関連サービスを停止し、クライアント接続がないことを確認する。

## チェックポイントを復元する

停止中のサーバーに対して、対象のチェックポイントを展開します。

```sh
p4d -r <p4root> -z -jr <checkpoint-name>.gz
```

特定時点まで戻す必要がある場合は、チェックポイント後のジャーナルを番号順に適用します。ジャーナルの適用順序とコマンドは、利用している p4d バージョンの公式バックアップ・リカバリー手順に従ってください。

## 起動後の確認

1. 通常のサービス管理方法で p4d を起動する。
2. `p4 info` と `p4 verify` を実行し、サーバー状態とアーカイブファイルを確認する。
3. 代表的なワークスペースで同期できることを確認する。
4. 監視、Proxy、Swarm、CI などの接続先サービスを確認する。

## 関連資料

* [db.have の復旧]({{ '/1-perforce/810-db-have-recovery/' | relative_url }})
* [Helix Core Server Administrator Guide](https://www.perforce.com/perforce/doc.current/manuals/p4sag/Content/P4SAG/Home-p4sag.html)