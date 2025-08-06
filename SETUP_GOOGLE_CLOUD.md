# Google Cloud設定手順

このアプリケーションを使用するために必要なGoogle Cloud Consoleの設定手順を説明します。

## 1. Google Cloud Projectの作成

1. [Google Cloud Console](https://console.cloud.google.com/)にアクセス
2. 既存のGoogleアカウントでログイン
3. プロジェクトセレクタから「新しいプロジェクト」をクリック
4. プロジェクト名（例：pokepoke-checker）を入力して作成

## 2. Google Sheets APIの有効化

1. 左側のメニューから「APIとサービス」→「ライブラリ」を選択
2. 検索ボックスで「Google Sheets API」を検索
3. 「Google Sheets API」をクリックして「有効にする」ボタンをクリック

## 3. 認証情報の作成

### APIキーの作成
1. 「APIとサービス」→「認証情報」を選択
2. 「認証情報を作成」→「APIキー」をクリック
3. 作成されたAPIキーをコピーして保存
4. 「キーを制限」をクリックして、以下の設定を行う：
   - アプリケーションの制限：HTTPリファラー
   - ウェブサイトの制限：
     - `http://localhost:3000/*`（開発用）
     - `https://YOUR-GITHUB-USERNAME.github.io/*`（本番用）
   - APIの制限：Google Sheets APIのみに制限

### OAuth 2.0 クライアントIDの作成（オプション）
1. 「認証情報を作成」→「OAuth クライアント ID」をクリック
2. 同意画面の設定が必要な場合は設定
3. アプリケーションの種類：「ウェブアプリケーション」を選択
4. 以下を設定：
   - 名前：pokepoke-checker-web
   - 承認済みのJavaScript生成元：
     - `http://localhost:3000`
     - `https://YOUR-GITHUB-USERNAME.github.io`
5. クライアントIDをコピーして保存

## 4. Google Sheetsの準備

### スプレッドシートの作成
1. [Google Sheets](https://sheets.google.com/)で新しいスプレッドシートを作成
2. 以下の3つのシートを作成：

#### Cardsシート（カードマスターデータ）
| A列（ID） | B列（Number） | C列（Name） | D列（Rarity） | E列（Series） | F列（ImageURL） |
|----------|--------------|------------|--------------|--------------|----------------|
| card001  | 001          | ピカチュウ   | R            | 第1弾         | （画像URL）      |
| card002  | 002          | フシギダネ   | C            | 第1弾         | （画像URL）      |

#### Usersシート（ユーザー管理）
| A列（ID） | B列（Name） | C列（Email） |
|----------|------------|-------------|
| user1    | 太郎        | taro@example.com |
| user2    | 花子        | hanako@example.com |

#### Ownershipシート（所持状況）
| A列（CardID） | B列（UserID） | C列（Owned） | D列（Quantity） | E列（Notes） |
|--------------|--------------|-------------|----------------|-------------|
| card001      | user1        | TRUE        | 1              | キラカード    |
| card002      | user1        | FALSE       | 0              |              |

### スプレッドシートの共有設定
1. スプレッドシートの右上「共有」ボタンをクリック
2. 「リンクを知っている全員」に変更
3. 権限を「編集者」に設定（APIから書き込み可能にするため）
4. スプレッドシートのIDをURLから取得：
   `https://docs.google.com/spreadsheets/d/【ここがスプレッドシートID】/edit`

## 5. 環境変数の設定

1. プロジェクトルートに`.env`ファイルを作成（.env.exampleを参考）
2. 以下の値を設定：

```bash
REACT_APP_GOOGLE_API_KEY=取得したAPIキー
REACT_APP_GOOGLE_CLIENT_ID=取得したクライアントID（オプション）
REACT_APP_SPREADSHEET_ID=スプレッドシートのID
```

## 注意事項

- APIキーは公開リポジトリにコミットしないよう注意
- 本番環境では適切なドメイン制限を設定
- 無料枠内での使用であれば料金は発生しません
- Google Sheets APIの制限：
  - 読み取り：100リクエスト/100秒/ユーザー
  - 書き込み：100リクエスト/100秒/ユーザー