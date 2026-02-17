# デプロイ

## 前提条件

- サーバーに Docker と Portainer がインストールされていること
- Tailscale の Auth Key (`tskey-auth-...`) を取得済みであること（[Tailscale Admin Console](https://login.tailscale.com/admin/settings/keys)）
- GitHub Container Registry (GHCR) の認証情報（個人アクセストークン等）
  - GitHub Organization の設定により、パッケージの Visibility が `Private` に制限されています。
  - デプロイ環境でイメージをプルするために、適切な権限を持つ GitHub Personal Access Token (PAT) を用意し、`docker login ghcr.io` で認証を行ってください。

## 認証情報の準備

1. GitHub の [Personal Access Tokens](https://github.com/settings/tokens) (Classic) で `read:packages` 権限を持つトークンを作成
2. サーバー上で以下のコマンドを実行して GHCR にログイン
   ```bash
   ```
   echo "YOUR_PAT" | docker login ghcr.io -u YOUR_GITHUB_USERNAME --password-stdin
   ```

## Portainer へのレジストリ追加

1. Portainer にログインし、左メニューの Settings -> Registries を選択
2. Add registry をクリック
3. Custom registry を選択
4. 以下の情報を入力：
   - Name: `GitHub Container Registry` (任意の名前)
   - Registry URL: `ghcr.io`
   - Authentication: ON
   - Username: GitHubのユーザー名
   - Password: GitHubのPersonal Access Token (PAT)
5. Add registry をクリック


## デプロイ手順

1. Portainer にログイン
2. Stacks メニューを開き、Add stack をクリック
3. Name に `kc3hack-2026-team14` 等を入力
4. Build method で Repository を選択
   - Repository URL: このリポジトリの URL
   - Repository reference: `refs/heads/main` (または `develop`)
   - Compose path: `docker-compose.prod.yml`
5. Environment variables を設定

   ```env
   DEBUG=False
   SECRET_KEY=django-insecure-CHANGE_ME
   ALLOWED_HOSTS=localhost,127.0.0.1,[::1],.ts.net
   
   # Database
   POSTGRES_DB=kc3hack_db
   POSTGRES_USER=kc3hack_user
   POSTGRES_PASSWORD=change_this_password
   POSTGRES_HOST=db
   POSTGRES_PORT=5432
   
   # MinIO
   MINIO_ROOT_USER=minio_admin
   MINIO_ROOT_PASSWORD=change_this_password
   MINIO_BUCKET_NAME=kc3hack-bucket
   MINIO_ENDPOINT_URL=http://minio:9000
   
   # Tailscale
   TS_AUTHKEY=tskey-auth-xxxxx
   TS_HOSTNAME=kc3hack-team14
   
   # GitHub Container Registry (Watchtower auth)
   GH_USERNAME=your-github-username
   GH_PAT=ghp_your_personal_access_token
   ```

6. Deploy the stack をクリック

## アクセス確認

Tailscale Admin Console で機器が接続されたことを確認し、発行された URL にアクセスしてください。
例: `https://kc3hack-team14.tailnet-name.ts.net`
