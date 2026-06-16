name: "野球観戦：試合予定"
description: "プロ野球観戦の予定を管理する Issue テンプレート"
title: "[観戦予定] YYYY-MM-DD：チーム名 vs チーム名（球場）"
labels:
  - baseball
  - schedule
body:
  - type: markdown
    attributes:
      value: |
        ## 観戦予定の詳細  
        試合観戦の予定を記録し、当日の動線・チケット・同行者情報を管理するための Issue です。

  - type: input
    id: date
    attributes:
      label: 試合日
      description: "例：2026-08-16"
      placeholder: "YYYY-MM-DD"
    validations:
      required: true

  - type: input
    id: game
    attributes:
      label: 対戦カード
      description: "例：中日 vs 巨人"
      placeholder: "ホーム vs ビジター"
    validations:
      required: true

  - type: input
    id: stadium
    attributes:
      label: 球場
      description: "例：バンテリンドーム"
      placeholder: "球場名"
    validations:
      required: true

  - type: dropdown
    id: seat
    attributes:
      label: 座席種別
      options:
        - 未定
        - 内野指定
        - 外野指定
        - プレミアムシート
        - その他
    validations:
      required: false

  - type: textarea
    id: tickets
    attributes:
      label: チケット情報
      description: "購入状況・QRコードURL・座席番号など"
      placeholder: |
        - 購入済み / 未購入
        - 座席番号：
        - チケットURL：

  - type: textarea
    id: partner
    attributes:
      label: 同行者
      description: "同行予定のパートナー・友人など"
      placeholder: |
        - パートナー：◯◯
        - 友人：△△

  - type: textarea
    id: schedule
    attributes:
      label: 当日の行動計画
      description: "移動手段・集合時間・食事など"
      placeholder: |
        - 集合：
        - 移動：
        - 球場到着：
        - 試合後：

  - type: textarea
    id: notes
    attributes:
      label: メモ
      description: "その他の注意点・持ち物・天候など"
      placeholder: |
        - 持ち物：
        - 天候：
        - その他メモ：
