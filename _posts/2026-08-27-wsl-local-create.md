---
title: "2度目のガン手術から退院した"
layout: post
categories: ["blog","tech"]
tags: ["wsl", "docker"]
date: 2026-08-27
---


# WSL2 + Ubuntu + Docker Engine 構築メモ

## 目的

WSL2 上の Ubuntu に Docker Engine を導入し、Windows から Docker コマンドを使えるようにするための手順メモ  
また、WSL2 上で動作する SSH や Docker コンテナを Windows 経由で外部公開するための基本手順もまとめる  

## 前提

- Windows で WSL2 が利用できる状態
- 管理者権限で PowerShell を起動できる状態
- インターネット接続が可能

<!--more-->

## WSL を起動

PowerShell から WSL の Ubuntu を起動  

```powershell
# 起動
wsl -d Ubuntu

# root で動かしたい場合
wsl -d Ubuntu -u root
```

## 1. WSL2 をインストール

管理者 PowerShell で実行  

```powershell
wsl --install Ubuntu
```

## 2. systemd を有効化

WSL の Ubuntu を起動  

```powershell
wsl -d Ubuntu
```

設定ファイルを編集  

```bash
sudo vim /etc/wsl.conf
```

内容は次のようにする  

```ini
[boot]
systemd=true
```

保存したら、WSL を再起動  

```powershell
wsl --shutdown
```

その後、再度 WSL を起動  

---

## 3. Docker Engine を Ubuntu にインストール

### 3-1. 依存パッケージをインストール

```bash
sudo apt update
sudo apt install -y ca-certificates curl gnupg lsb-release
```

### 3-2. Docker の GPG キーを登録

```bash
sudo install -m 0755 -d /etc/apt/keyrings
curl -fsSL https://download.docker.com/linux/ubuntu/gpg | \
sudo gpg --dearmor -o /etc/apt/keyrings/docker.gpg
sudo chmod a+r /etc/apt/keyrings/docker.gpg
```

### 3-3. Docker リポジトリを追加

```bash
echo \
  "deb [arch=$(dpkg --print-architecture) signed-by=/etc/apt/keyrings/docker.gpg] \
  https://download.docker.com/linux/ubuntu \
  $(lsb_release -cs) stable" | \
  sudo tee /etc/apt/sources.list.d/docker.list > /dev/null
```

### 3-4. Docker Engine をインストール

```bash
sudo apt update
sudo apt install -y docker-ce docker-ce-cli containerd.io docker-buildx-plugin docker-compose-plugin
```

### 3-5. Docker を systemd で起動

```bash
sudo systemctl enable docker
sudo systemctl start docker
```

### 3-6. sudo なしで Docker を使う

```bash
sudo usermod -aG docker $USER
```

WSL を再起動するか、ログアウトして再ログイン  

## 4. 動作確認

### WSL 側

```bash
sudo systemctl status docker
```

### Windows 側

```powershell
wsl docker --version
wsl docker info
wsl docker compose version
```

正常に動作していれば、Docker のバージョン情報とクライアント情報が表示される  

## 6. Ubuntu イメージのバックアップと復元

```powershell
wsl --export Ubuntu E:\wsl\ubuntu.tar
wsl --unregister Ubuntu
wsl --import Ubuntu E:\wsl\Ubuntu E:\wsl\ubuntu.tar
```

## 7. 補足

- 変更を反映するには WSL の再起動が必要な場合がある
- 無操作でWSL停止するので `wsl -u <ユーザーアカウント>` でWSLログインしているターミナルを常に起動しておく