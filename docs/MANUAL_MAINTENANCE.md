# System Manual & Screenshot Maintenance

## 1. 方針

利用者向けマニュアルはWord/PDFを正本にせず、**システム内のWebマニュアルを正本**とします。

- 店舗: `/help`
- 本部: `/admin/help`
- 各主要画面: `？ この画面の使い方`

本文source:

`src/lib/manual.ts`

この方式ならコードと同じGit履歴で更新できます。

## 2. なぜ画面キャプチャを自動化するか

スクリーンショットは初心者には非常に分かりやすい一方、UI改修で古くなります。

Camiでは手作業でWordへ貼り直すのではなく、STAGINGへ反映後にPlaywrightで主要画面を再取得します。

## 3. 保存場所

```text
public/manual/screenshots/
├─ member/
└─ admin/
```

マニュアル画面は画像が存在すれば表示し、未生成・削除時は「画面キャプチャ準備中」のfallbackを表示します。本文自体は画像なしでも利用できます。

## 4. Capture target

`scripts/manual-capture-targets.json`

ここに、取得するrole / URL path / output fileを定義します。

`src/lib/manual.ts`で参照する画像は、`npm run docs:check`でcapture targetに登録済みか検査します。

## 5. 初回準備

PlaywrightはProduction application dependencyへ常設せず、manual capture作業時だけローカルに導入できます。

```bash
npm install --no-save playwright
npx playwright install chromium
```

package.json / package-lockを変更しないことを確認してください。`--no-save`を利用します。

## 6. STAGINGから取得

credentialをコードへ書きません。shell environmentで渡します。

```bash
export CAMI_MANUAL_BASE_URL="https://cami-order-system-staging.cami-order-system.workers.dev"
export CAMI_MANUAL_MEMBER_EMAIL="<staging member email>"
export CAMI_MANUAL_ADMIN_EMAIL="<staging admin email>"

# パスワードはshell historyへ値を残さないよう対話入力します
read -s CAMI_MANUAL_MEMBER_PASSWORD
export CAMI_MANUAL_MEMBER_PASSWORD

read -s CAMI_MANUAL_ADMIN_PASSWORD
export CAMI_MANUAL_ADMIN_PASSWORD

npm run manual:capture
```

スクリプトはログイン後、対象画面を1440x900で取得します。サイドバーのログイン名・メールは`data-manual-mask`を利用してぼかします。STAGINGバナーもcapture時のみ非表示にします。

## 7. Productionを使わない

manual captureはSTAGINGを標準とします。

Production Worker URLを指定すると、`ALLOW_PRODUCTION_MANUAL_CAPTURE=true`がない限り停止します。

原則としてProductionで許可フラグを使わず、STAGINGのテストデータから作成してください。

## 8. 画面変更時

UIを変更したら次を判定します。

### screenshot更新が必要

- button位置/名称が変わった
- form項目が変わった
- navigationが変わった
- 主要一覧/詳細layoutが変わった
- 初心者の操作手順に影響する

### screenshot更新不要な例

- backendのみのバグ修正
- loggingのみ
- DB index追加のみ
- 見た目に影響しないsecurity fix

## 9. 新しいマニュアル記事

1. `src/lib/manual.ts`へarticleを追加
2. 必要なら`getContextHelpHref()`へpath mapping追加
3. screenshotが必要なら`manual-capture-targets.json`へ追加
4. `npm run docs:check`
5. STAGINGへ反映
6. `npm run manual:capture`
7. 画像と本文を目視レビュー

## 10. 機密情報

manual screenshotへProductionの実顧客個人情報を入れません。

- 原則STAGING test accountを使用
- ログイン中ユーザー名/emailはmask
- 注文詳細等の実顧客画面をcapture targetへ安易に追加しない
- token/password/cookieを成果物へ保存しない

## 11. Manual更新チェック

```bash
npm run docs:generate
npm run docs:check
```

マニュアル本文の誤りは自動検出しきれないため、業務ルール変更時は必ず人またはレビューAIが内容も読み直します。
