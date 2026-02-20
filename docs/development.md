# 開発環境のセットアップ

## 前提条件

- Python 3.14 以上
- uv
- Docker Engine + Docker Compose
- GDAL / GEOS ライブラリ (GeoDjango用)
  - Ubuntu/Debian: `sudo apt-get install gdal-bin libgdal-dev`
  - macOS: `brew install gdal`
  - Windows: OSGeo4Wインストーラーなどを使用してください

## リポジトリのクローン

```bash
git clone git@github.com:kc3hack/2026_team14.git
cd 2026_team14
```

## セットアップ

```bash
uv run poe setup
```

### 管理ユーザーの作成

セットアップ完了後、必要に応じて管理ユーザー（Django Superuser）を作成してください。
これを作成すると、[http://127.0.0.1:8000/admin/](http://127.0.0.1:8000/admin/) から管理画面にログインしてデータを操作できます。

```bash
uv run python manage.py createsuperuser
```

## 開発の再開

一度セットアップをした後、開発を再開する場合は以下の手順で起動します。

### インフラの起動
```bash
docker compose up -d
```

### サーバーの起動
```bash
uv run poe dev
# または
uv run python manage.py runserver
```

### アクセス

#### Web
- [http://127.0.0.1:8000](http://127.0.0.1:8000)

#### MinIO Console
- [http://127.0.0.1:9001](http://127.0.0.1:9001) (u: `minio_admin`, p: `minio_password`)

###　インストールしたもの
- Pillow