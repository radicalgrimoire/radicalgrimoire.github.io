---
title: "Helix Core 管理者ガイド"
layout: page
order: 200
categories: [perforce, administrator]
permalink: /1-perforce/200-administrator-guide/
---

# Helix Core 管理者向け手順

Helix Core (Perforce) の構築、運用、障害対応に関する手順です。作業前に対象サーバーのバージョン、`P4ROOT`、サービス管理方法、バックアップ状態を確認してください。

## 構築

* [Helix p4d のコンテナ構築]({{ '/1-perforce/210-helix-p4d-setup/' | relative_url }})
* [コミット/エッジサーバー構成]({{ '/1-perforce/220-commit-edge-server/' | relative_url }})
* [トリガーの公式ドキュメント]({{ '/1-perforce/230-trigger-configuration/' | relative_url }})
* [大文字・小文字チェック用トリガー]({{ '/1-perforce/240-trigger-case-check/' | relative_url }})

## 運用・障害対応

* [障害対応の判断フロー]({{ '/1-perforce/800-incident-response/' | relative_url }})
* [db.have の復旧]({{ '/1-perforce/810-db-have-recovery/' | relative_url }})
* [チェックポイントからの復旧]({{ '/1-perforce/250-checkpoint-backup-and-restore/' | relative_url }})
* [SSL 証明書の更新]({{ '/1-perforce/260-ssl-certificate-renewal/' | relative_url }})
* [他ユーザーのチェックアウトを解除する]({{ '/1-perforce/820-revoke-other-user-checkout/' | relative_url }})
* [shelve に起因するロックを解除する]({{ '/1-perforce/830-unlock-shelved-file/' | relative_url }})
* [Helix Swarm]({{ '/1-perforce/270-helix-swarm/' | relative_url }})