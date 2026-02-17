# デプロイ

## 前提条件

- サーバーに Docker と Portainer がインストールされていること
- Tailscale の Auth Key (`tskey-auth-...`) を取得済みであること（[Tailscale Admin Console](https://login.tailscale.com/admin/settings/keys)）
- GitHub Container Registry のパッケージ公開設定
  - GitHub Actions が初回実行された後、GitHub のパッケージ設定（Packages -> Package Settings）で、`Visibility` を `Public` に変更してください。

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
   ```

6. Deploy the stack をクリック

## アクセス確認

Tailscale Admin Console で機器が接続されたことを確認し、発行された URL にアクセスしてください。
例: `https://kc3hack-team14.tailnet-name.ts.net`
