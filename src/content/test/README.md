# メール送信テストフォーム

フォーム画面は `/test/mail/` にあります。フロントエンドは
`src/pages/test/mail.astro`、GASのWebアプリ用コードは同じディレクトリの
`Code.gs` です。宛先メールアドレスやreCAPTCHAの秘密鍵はソースに書かず、
GASのスクリプトプロパティに設定してください。

## 1. reCAPTCHA v2を用意

Google reCAPTCHA管理画面で「reCAPTCHA v2」のチェックボックスを登録し、
GitHub Pagesのホスト名（通常は `radicalgrimoire.github.io`）を許可します。
表示されるサイトキーとシークレットキーを控えます。サイトキーは公開情報、
シークレットキーはGASだけに設定します。

## 2. GASをデプロイ

1. Google Apps Scriptで新しいプロジェクトを作成し、`Code.gs` の内容を貼り付けます。
2. プロジェクトの「プロジェクトの設定」からスクリプトプロパティを登録します。
   - `RECIPIENT_EMAIL`: 受信する自分のメールアドレス
   - `RECAPTCHA_SECRET`: reCAPTCHAのシークレットキー
   - `ALLOWED_HOSTNAME`: reCAPTCHAに登録したホスト名（例: `radicalgrimoire.github.io`）
3. 「デプロイ」→「新しいデプロイ」→「ウェブアプリ」を選択します。
   - 次のユーザーとして実行: 自分
   - アクセスできるユーザー: 全員
4. デプロイ後に表示されるウェブアプリURL（`https://script.google.com/macros/s/.../exec`）をコピーします。

公開アクセスのWebアプリなので、宛先や秘密鍵をHTMLに置かないでください。
このフォームはreCAPTCHAトークンをGAS側で検証してからメールを送信します。

## 3. GitHub Pagesのビルド変数を設定

リポジトリの **Settings → Secrets and variables → Actions → Variables** に次を登録します。

- `PUBLIC_TEST_FORM_GAS_URL`: 手順2のウェブアプリURL
- `PUBLIC_RECAPTCHA_SITE_KEY`: reCAPTCHAのサイトキー

`main` にpushするか、Actionsからデプロイワークフローを実行すると `/test/mail/` が有効になります。
ローカルで試す場合は、プロジェクトルートの`.env`に同じ変数を設定してから
`npm run dev` を実行してください。`.env`をGitに追加しないでください。

フォーム送信後、送信結果は新しいタブに表示されます。テスト送信の前に、
GASの実行ユーザーでメール送信の権限を承認してください。
