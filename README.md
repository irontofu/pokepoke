# ポケポケ図鑑チェッカー

複数人でポケポケカードの所持状況を共有し、誰がどのカードを持っていない/持っているかを確認できるWebツールです。

## 機能

- カード一覧の表示とフィルタリング
- 個人の所持状況の記録
- 複数ユーザーの管理
- 統計情報の表示（コンプリート率、レアリティ別統計など）
- 誰も持っていないカードの確認

## セットアップ

### 1. リポジトリのクローン

```bash
git clone https://github.com/YOUR-USERNAME/pokepoke.git
cd pokepoke
npm install
```

### 2. Google Cloud設定

詳細な手順は[SETUP_GOOGLE_CLOUD.md](./SETUP_GOOGLE_CLOUD.md)を参照してください。

1. Google Cloud Projectを作成
2. Google Sheets APIを有効化
3. APIキーを作成
4. Google Sheetsでデータベースを準備

### 3. 環境変数の設定

`.env.example`をコピーして`.env`を作成し、取得した認証情報を設定：

```bash
cp .env.example .env
```

### 4. 開発サーバーの起動

```bash
npm start
```

## デプロイ

### GitHub Pagesへのデプロイ

1. `package.json`の`homepage`フィールドを自分のGitHubユーザー名に更新
2. GitHubリポジトリのSecretsに以下を設定：
   - `REACT_APP_GOOGLE_API_KEY`
   - `REACT_APP_GOOGLE_CLIENT_ID`
   - `REACT_APP_SPREADSHEET_ID`
3. mainブランチにpushすると自動的にGitHub Pagesにデプロイされます

## 使い方

1. ユーザーを選択
2. カード一覧から所持しているカードにチェック
3. 統計タブで進捗を確認

## 技術スタック

- React (TypeScript)
- Google Sheets API
- GitHub Pages
- GitHub Actions

## ライセンス

MIT