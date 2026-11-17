export type ManualRole = "member" | "admin";

export type ManualStep = {
  title: string;
  body: string;
  note?: string;
  warning?: string;
};

export type ManualArticle = {
  slug: string;
  role: ManualRole;
  category: string;
  title: string;
  summary: string;
  screenPath?: string;
  screenshot?: string;
  audience?: string;
  steps: ManualStep[];
  tips?: string[];
};

export const memberManualArticles: ManualArticle[] = [
  {
    slug: "getting-started",
    role: "member",
    category: "はじめに",
    title: "はじめて使う方へ",
    summary: "ログイン後の画面構成と、最初に確認する場所を説明します。",
    screenPath: "/dashboard",
    screenshot: "/manual/screenshots/member/dashboard.png",
    audience: "店舗・加盟店",
    steps: [
      { title: "ダッシュボードを確認する", body: "ログインすると店舗用ダッシュボードが表示されます。現在のランク、注文件数、最近の注文、お知らせを確認できます。" },
      { title: "左メニュー（スマホは☰）を使う", body: "「商品注文」「注文履歴」「配送先管理」「お知らせ」「契約書」「アカウント設定」「ヘルプ・マニュアル」から目的の画面へ移動します。" },
      { title: "最初に配送先と契約書を確認する", body: "注文前に配送先が登録されていること、最新の約款が公開されている場合は同意済みであることを確認してください。" },
    ],
    tips: ["困った画面では、ページ上部の「？ この画面の使い方」から該当マニュアルを直接開けます。"],
  },
  {
    slug: "place-order",
    role: "member",
    category: "注文",
    title: "商品を注文する",
    summary: "商品と箱数、配送先を選び、内容確認後に注文を確定する手順です。",
    screenPath: "/products",
    screenshot: "/manual/screenshots/member/products.png",
    audience: "店舗・加盟店",
    steps: [
      { title: "商品注文を開く", body: "メニューの「商品注文」を開きます。販売中の商品、箱単位の価格、在庫状況を確認できます。" },
      { title: "注文する箱数を入力する", body: "必要な商品の箱数を入力します。0箱の商品は注文対象になりません。", warning: "表示在庫を超える箱数は注文できません。" },
      { title: "配送先を選択する", body: "登録済み配送先から今回の配送先を選びます。配送先がない場合は、先に「配送先管理」で登録してください。" },
      { title: "注文内容を確認する", body: "商品・箱数・税抜金額・消費税・合計・配送先を確認して確認画面へ進みます。送料はシステム上では別途案内扱いです。" },
      { title: "注文を確定する", body: "内容に間違いがなければ注文を確定します。確定後は注文詳細画面へ移動します。", warning: "確定ボタンを連続して押さないでください。通信切断やタイムアウトで結果を確認できない場合は、再注文せず注文履歴で確認し、本部へお問い合わせください。" },
    ],
    tips: ["クイック再注文やCSV一括発注は、管理者が該当の機能フラグをONにしている場合だけ表示されます。", "最新約款への同意が必要な場合、未同意のまま注文しようとすると注文は受け付けられません。"],
  },
  {
    slug: "order-history",
    role: "member",
    category: "注文",
    title: "注文履歴を確認する",
    summary: "過去の注文、現在のステータス、請求書や再注文への入口を確認します。",
    screenPath: "/orders",
    screenshot: "/manual/screenshots/member/orders.png",
    audience: "店舗・加盟店",
    steps: [
      { title: "注文履歴を開く", body: "メニューの「注文履歴」を開きます。注文番号、注文日、金額、ステータスを一覧で確認できます。" },
      { title: "注文詳細を開く", body: "確認したい注文を開くと、注文商品・配送先・注文ステータスの進行状況を確認できます。" },
      { title: "必要に応じて請求書・再注文を使う", body: "対象ステータスの注文では請求書表示が利用できます。クイック再注文が有効な場合は、過去の注文内容を商品注文画面へ読み込めます。" },
    ],
  },
  {
    slug: "order-cancellation",
    role: "member",
    category: "注文",
    title: "注文のキャンセルを申し込む",
    summary: "確認待ち・確認済みの注文に対してキャンセル申込を行う手順です。",
    screenPath: "/orders",
    screenshot: "/manual/screenshots/member/orders.png",
    audience: "店舗・加盟店",
    steps: [
      { title: "対象注文の詳細を開く", body: "注文履歴からキャンセルしたい注文を開きます。" },
      { title: "キャンセル申込を開く", body: "キャンセル可能なステータス（注文受付または確認済み）の場合、「キャンセルを申し込む」が表示されます。" },
      { title: "理由を確認して申し込む", body: "必要に応じてキャンセル理由を入力し、申込を確定します。" },
      { title: "本部の審査結果を待つ", body: "申込後は「キャンセル申込中」です。本部が承認するとキャンセルが確定し、引き当て済み在庫が戻されます。却下された場合は元の注文状態へ戻ります。", warning: "キャンセル申込だけではキャンセル確定ではありません。" },
    ],
  },
  {
    slug: "invoices",
    role: "member",
    category: "請求",
    title: "請求書を確認・印刷する",
    summary: "注文や月次請求書の内容を画面で確認し、必要に応じて印刷します。",
    screenPath: "/orders",
    screenshot: "/manual/screenshots/member/orders.png",
    audience: "店舗・加盟店",
    steps: [
      { title: "請求書を開く", body: "注文履歴または案内された請求書リンクから請求書を開きます。" },
      { title: "請求内容を確認する", body: "請求先、請求書番号、対象期間、対象注文、税額、合計金額を確認します。" },
      { title: "必要に応じて印刷する", body: "請求書画面の印刷ボタンを利用し、ブラウザの印刷機能から紙またはPDFへ保存できます。" },
    ],
    tips: ["支払状況の更新は本部側で行います。"],
  },
  {
    slug: "addresses",
    role: "member",
    category: "設定",
    title: "配送先を登録・変更する",
    summary: "注文時に使用する配送先の追加、デフォルト設定、削除を行います。",
    screenPath: "/addresses",
    screenshot: "/manual/screenshots/member/addresses.png",
    audience: "店舗・加盟店",
    steps: [
      { title: "配送先管理を開く", body: "メニューから「配送先管理」を開きます。" },
      { title: "配送先を追加する", body: "宛名、郵便番号、都道府県、住所、電話番号などを入力し登録します。" },
      { title: "デフォルト配送先を設定する", body: "よく使う配送先をデフォルトにすると、商品注文画面で最初から選択されます。" },
      { title: "不要な配送先を削除する", body: "不要になった配送先は削除できます。過去注文との整合性を保つため、システム内部では論理削除として扱われます。" },
    ],
  },
  {
    slug: "announcements",
    role: "member",
    category: "確認",
    title: "本部からのお知らせを見る",
    summary: "全体・個別のお知らせと未読状態を確認します。",
    screenPath: "/announcements",
    screenshot: "/manual/screenshots/member/announcements.png",
    audience: "店舗・加盟店",
    steps: [
      { title: "お知らせを開く", body: "メニューの「お知らせ」を開きます。未読がある場合はメニューに件数バッジが表示されます。" },
      { title: "本文を確認する", body: "対象のお知らせを開いて内容を確認します。開いたお知らせは既読として記録されます。" },
    ],
  },
  {
    slug: "terms",
    role: "member",
    category: "契約",
    title: "契約書・約款を確認する",
    summary: "本部が公開した最新の取引約款を確認し、必要な場合は同意します。",
    screenPath: "/terms",
    screenshot: "/manual/screenshots/member/terms.png",
    audience: "店舗・加盟店",
    steps: [
      { title: "契約書を開く", body: "メニューの「契約書」を開き、公開中の約款を確認します。" },
      { title: "最新版へ同意する", body: "新しい約款が公開され、同意が必要な場合は画面の案内に従って同意します。" },
      { title: "注文前に同意状態を確認する", body: "最新の公開約款への同意が必要な場合、同意するまで新規注文は受け付けられません。" },
    ],
  },
  {
    slug: "account",
    role: "member",
    category: "設定",
    title: "アカウントとパスワードを管理する",
    summary: "ログイン情報を確認し、パスワードを変更します。",
    screenPath: "/account",
    screenshot: "/manual/screenshots/member/account.png",
    audience: "店舗・加盟店",
    steps: [
      { title: "アカウント設定を開く", body: "メニューから「アカウント設定」を開きます。" },
      { title: "パスワードを変更する", body: "現在のパスワードと新しいパスワードを入力して変更します。新しいパスワードは8文字以上にしてください。" },
      { title: "変更後は新しいパスワードを使う", body: "次回以降のログインでは新しいパスワードを使用してください。" },
    ],
  },
];

export const adminManualArticles: ManualArticle[] = [
  {
    slug: "admin-review",
    role: "admin",
    category: "はじめに",
    title: "確認担当者のための閲覧ガイド",
    summary: "確認する順番と、気になる点を本部へ伝える方法をまとめています。",
    screenPath: "/admin/dashboard",
    audience: "閲覧専用の確認担当者",
    steps: [
      { title: "ログインと確認範囲を確かめる", body: "案内された確認用アカウントでログインします。閲覧専用では、注文・商品・在庫・請求の内容を確認できます。登録・変更・出荷などの更新操作はできません。", warning: "本番の画面です。確認のための架空の注文や在庫変更は行わないでください。アカウントやパスワードは他の方と共有しないでください。" },
      { title: "商品・在庫・注文の順に見る", body: "メニューの「商品管理」で商品名・画像・説明を確認し、「在庫管理」「注文管理」へ進みます。日々の業務に必要な情報が揃っているか確認してください。", note: "新商品の在庫0は、実在庫が未登録の場合もあります。現物がないとは断定せず、本部に確認してください。販売停止中の旧商品は、過去の注文履歴を保つため残している場合があります。" },
      { title: "気になる点をLINEへ送る", body: "「画面名」「やりたいこと・困っていること」「どうなると使いやすいか」「優先度（必須・あると便利）」を添えて、案内された連絡先へお送りください。", warning: "スクリーンショットにはパスワード、お客様の氏名・住所・連絡先を写さないでください。エラー時は発生した時刻と、直前に行った操作もお知らせください。" },
      { title: "確認を終える", body: "使い終わったらメニューからログアウトしてください。登録・変更を含めて確認したい場合は、対象業務を本部へお知らせください。正式運用前に、確認用アカウントを停止し、担当者ごとのアカウントへ切り替えます。" },
    ],
    tips: ["修正内容は検証環境で確認してから本番へ反映します。", "保存の結果が分からない場合は、同じ操作を繰り返す前に履歴と担当者へ確認してください。"],
  },
  {
    slug: "admin-overview",
    role: "admin",
    category: "はじめに",
    title: "本部管理画面の基本",
    summary: "ダッシュボード、メニュー、権限の考え方を説明します。",
    screenPath: "/admin/dashboard",
    screenshot: "/manual/screenshots/admin/dashboard.png",
    audience: "本部管理者",
    steps: [
      { title: "ダッシュボードを確認する", body: "総注文数、確認待ち注文、審査待ち会員、請求・在庫の警告、最近の注文を確認します。" },
      { title: "左メニューから業務画面へ移動する", body: "注文、請求書、会員、商品、在庫、ランク、約款、お知らせを管理します。スーパー管理者には管理者設定・システム設定・機能フラグ・監査ログも表示されます。" },
      { title: "権限を意識して操作する", body: "viewerは閲覧中心、editorは通常の更新操作、superadminは管理者設定や機能フラグなどの高権限操作を行います。サーバー側でも権限チェックされます。" },
    ],
  },
  {
    slug: "admin-orders",
    role: "admin",
    category: "注文",
    title: "注文を確認・出荷する",
    summary: "注文受付から確認、発送、配達完了までの管理手順です。",
    screenPath: "/admin/orders",
    screenshot: "/manual/screenshots/admin/orders.png",
    audience: "本部管理者・編集者",
    steps: [
      { title: "注文管理を開く", body: "注文一覧で注文番号、会員、金額、ステータスなどを確認します。検索や絞り込みを利用できます。" },
      { title: "注文詳細を確認する", body: "商品、数量、配送先、金額、現在のステータス、変更履歴を確認します。" },
      { title: "注文を確認済みにする", body: "注文受付（pending）を確認後、確認済み（confirmed）へ進めます。" },
      { title: "発送する", body: "確認済み注文を発送済みへ進めます。発送時は追跡番号が必要です。" },
      { title: "配達完了にする", body: "商品到着を確認後、発送済み注文を配達完了へ進めます。", warning: "ステータスは定められた順序以外へ変更できません。" },
    ],
    tips: ["注文ステータス変更は履歴と監査ログに記録されます。", "納品書は注文詳細から印刷できます。"],
  },
  {
    slug: "admin-cancellations",
    role: "admin",
    category: "注文",
    title: "キャンセル申込を承認・却下する",
    summary: "店舗から届いたキャンセル申込を審査します。",
    screenPath: "/admin/orders",
    screenshot: "/manual/screenshots/admin/orders.png",
    audience: "本部管理者・編集者",
    steps: [
      { title: "キャンセル申込中の注文を確認する", body: "注文管理からキャンセル申込中（cancel_requested）の注文を開き、理由と注文内容を確認します。" },
      { title: "承認する", body: "承認すると注文はキャンセル済みになり、注文時に引き当てた在庫がシステム上で戻されます。", warning: "在庫数量に関わる重要操作です。対象注文を必ず確認してから承認してください。" },
      { title: "却下する", body: "却下すると、注文はキャンセル申込前のステータスへ戻ります。" },
    ],
  },
  {
    slug: "admin-invoices",
    role: "admin",
    category: "請求",
    title: "月次請求書を発行・管理する",
    summary: "会員と対象年月を選び、対象注文をまとめた請求書を発行します。",
    screenPath: "/admin/invoices",
    screenshot: "/manual/screenshots/admin/invoices.png",
    audience: "本部管理者・編集者",
    steps: [
      { title: "請求書管理を開く", body: "発行済み請求書の一覧と月次請求書発行フォームを確認します。" },
      { title: "会員・年・月を選ぶ", body: "請求対象の会員と対象年月を選択します。" },
      { title: "請求書を発行する", body: "対象月の確認済み・発送済み・配達完了の注文が対象です。同じ会員・同じ年月の請求書は重複発行できません。" },
      { title: "請求内容を確認する", body: "発行時点の対象注文はスナップショットとして固定されます。請求書詳細で注文内訳と金額を確認します。" },
      { title: "支払状況を更新する", body: "未払い・支払済み・期限超過を業務状況に合わせて更新します。" },
    ],
    tips: ["請求書のメール送付は機能フラグとメール設定が有効な場合だけ使用してください。", "ブラウザの印刷機能から紙またはPDFへ保存できます。"],
  },
  {
    slug: "admin-members",
    role: "admin",
    category: "会員",
    title: "会員を審査・管理する",
    summary: "登録申請、承認・却下・停止、ランクや配送先情報を確認します。",
    screenPath: "/admin/members",
    screenshot: "/manual/screenshots/admin/members.png",
    audience: "本部管理者・編集者",
    steps: [
      { title: "会員管理を開く", body: "申請中・承認済みなどの会員を一覧で確認します。" },
      { title: "申請内容を確認する", body: "会社・サロン情報、担当者、連絡先、事業概要を確認します。" },
      { title: "承認または却下する", body: "審査結果に応じて会員ステータスを更新します。approvedの会員だけが会員としてログインできます。" },
      { title: "ランクを設定する", body: "会員ランクを変更すると、以後の注文価格計算にそのランクの掛け率が利用されます。" },
    ],
  },
  {
    slug: "admin-products",
    role: "admin",
    category: "商品",
    title: "商品を登録・更新する",
    summary: "商品名、定価、入数、画像、販売状態を管理します。",
    screenPath: "/admin/products",
    screenshot: "/manual/screenshots/admin/products.png",
    audience: "本部管理者・編集者",
    steps: [
      { title: "商品管理を開く", body: "登録済み商品の一覧を確認します。" },
      { title: "商品情報を登録・編集する", body: "商品名、説明、定価、1箱あたり本数、販売状態などを設定します。" },
      { title: "商品画像を扱う", body: "画像アップロード機能はストレージ設定が必要です。ストレージ未設定環境ではアップロードAPIは利用できません。" },
    ],
  },
  {
    slug: "admin-inventory",
    role: "admin",
    category: "在庫",
    title: "在庫を入庫・調整する",
    summary: "商品ごとの箱数、入庫履歴、在庫警告を管理します。",
    screenPath: "/admin/inventory",
    screenshot: "/manual/screenshots/admin/inventory.png",
    audience: "本部管理者・編集者",
    steps: [
      { title: "在庫管理を開く", body: "各商品のBtoB用在庫、在庫切れ・低在庫状態、在庫金額を確認します。数量は箱単位です。Amazon等を含む全倉庫の現物在庫とは別に扱います。" },
      { title: "変更後の在庫と理由を入力する", body: "編集を開き、追加箱数ではなく、変更後のBtoB在庫の合計箱数を0以上の整数で入力します。変更理由は必須です。", warning: "例：現在20箱に5箱入荷した場合、変更後は25箱です。5箱と入力すると在庫が5箱になります。" },
      { title: "競合や通信失敗では再送しない", body: "他の担当者が更新した場合は最新在庫が再取得されます。保存結果が不明な場合も再読込後の在庫・履歴で確認してください。", warning: "通信エラーは未保存を意味しません。同じ入荷・調整を繰り返して登録しないでください。" },
      { title: "入庫履歴を確認する", body: "入庫履歴表示へ切り替えると直近の在庫更新を確認できます。" },
    ],
    tips: ["注文確定時の在庫引当とキャンセル承認時の在庫返却は自動処理です。手動調整と二重計上しないでください。", "別途構築中の全商品・全倉庫在庫システムは、本番の在庫元としてまだ接続していません。数量を合算したり自動同期済みと扱わないでください。"],
  },
  {
    slug: "admin-ranks",
    role: "admin",
    category: "会員",
    title: "会員ランクと掛け率を管理する",
    summary: "会員ごとの卸価格計算に使うランクと掛け率を管理します。",
    screenPath: "/admin/ranks",
    screenshot: "/manual/screenshots/admin/ranks.png",
    audience: "本部管理者・編集者",
    steps: [
      { title: "ランク管理を開く", body: "現在登録されているランク名、掛け率、基準などを確認します。" },
      { title: "ランクを登録・編集する", body: "業務ルールに合わせて掛け率等を設定します。" },
      { title: "会員へランクを割り当てる", body: "実際の会員への割り当ては会員詳細から行います。" },
    ],
  },
  {
    slug: "admin-terms",
    role: "admin",
    category: "契約",
    title: "約款を編集・公開する",
    summary: "店舗に表示する契約書・取引約款の下書き保存と公開を行います。",
    screenPath: "/admin/terms",
    screenshot: "/manual/screenshots/admin/terms.png",
    audience: "本部管理者・編集者",
    steps: [
      { title: "約款管理を開く", body: "現在の約款本文と公開状態を確認します。" },
      { title: "下書きを保存する", body: "内容を編集し、公開前に下書きとして保存できます。" },
      { title: "内容を確認して公開する", body: "公開すると店舗から閲覧可能になります。新しい公開版への同意が必要な店舗は、同意後に注文できるようになります。", warning: "公開は店舗の注文可否に影響します。正式な内容であることを確認してください。" },
    ],
  },
  {
    slug: "admin-announcements",
    role: "admin",
    category: "連絡",
    title: "店舗へお知らせを配信する",
    summary: "全店舗または個別店舗へお知らせを作成します。",
    screenPath: "/admin/announcements",
    screenshot: "/manual/screenshots/admin/announcements.png",
    audience: "本部管理者・編集者",
    steps: [
      { title: "お知らせ管理を開く", body: "既存のお知らせと新規作成フォームを確認します。" },
      { title: "配信対象を選ぶ", body: "全体または個別を選択します。個別の場合は対象店舗を指定します。" },
      { title: "内容と期限を設定する", body: "タイトル、本文、必要に応じて有効期限を入力して作成します。" },
      { title: "不要なお知らせを削除する", body: "不要になったものは一覧から削除できます。" },
    ],
  },
  {
    slug: "admin-administrators",
    role: "admin",
    category: "システム管理",
    title: "管理者アカウントを管理する",
    summary: "スーパー管理者が管理者の追加・編集・権限変更を行います。",
    screenPath: "/admin/administrators",
    screenshot: "/manual/screenshots/admin/administrators.png",
    audience: "スーパー管理者",
    steps: [
      { title: "管理者設定を開く", body: "この画面はスーパー管理者向けです。" },
      { title: "管理者を追加する", body: "氏名、メールアドレス、パスワード、権限を設定します。" },
      { title: "権限・有効状態を確認する", body: "superadmin / editor / viewerの役割に応じて必要最小限の権限を付与してください。", warning: "管理者権限の変更はセキュリティ上重要です。共有アカウントではなく個人単位で管理してください。" },
    ],
  },
  {
    slug: "admin-settings",
    role: "admin",
    category: "システム管理",
    title: "会社・請求・在庫設定を管理する",
    summary: "会社情報、インボイス登録番号、低在庫閾値などを設定します。",
    screenPath: "/admin/settings",
    screenshot: "/manual/screenshots/admin/settings.png",
    audience: "スーパー管理者",
    steps: [
      { title: "システム設定を開く", body: "会社名、住所、電話番号、メール等の基本情報を確認します。" },
      { title: "請求書用情報を設定する", body: "適格請求書発行事業者登録番号など、請求書・納品書に表示する情報を入力します。" },
      { title: "低在庫閾値を設定する", body: "在庫警告に使用する箱数の閾値を設定します。" },
      { title: "保存する", body: "変更内容を確認して保存します。viewer権限では保存できません。" },
    ],
  },
  {
    slug: "admin-feature-flags",
    role: "admin",
    category: "システム管理",
    title: "機能フラグを切り替える",
    summary: "追加機能の表示・利用可否をスーパー管理者が個別に切り替えます。",
    screenPath: "/admin/feature-flags",
    screenshot: "/manual/screenshots/admin/feature-flags.png",
    audience: "スーパー管理者",
    steps: [
      { title: "機能フラグを開く", body: "各追加機能の現在のON/OFFを確認します。" },
      { title: "説明を確認する", body: "フラグごとの影響範囲を確認してから変更します。" },
      { title: "必要な機能だけONにする", body: "OFFの機能は既存画面・業務に影響しない設計です。", warning: "本番での切替は業務影響を確認し、必要に応じて事前周知してから行ってください。" },
    ],
  },
  {
    slug: "admin-audit-logs",
    role: "admin",
    category: "システム管理",
    title: "監査ログを確認する",
    summary: "誰が・いつ・何を変更したかを追跡します。",
    screenPath: "/admin/audit-logs",
    screenshot: "/manual/screenshots/admin/audit-logs.png",
    audience: "スーパー管理者",
    steps: [
      { title: "監査ログを開く", body: "実行者、操作種類、対象種類、対象ID、期間で絞り込みできます。" },
      { title: "変更内容を確認する", body: "障害調査、問い合わせ、誤操作の確認時に対象操作の記録を追跡します。" },
      { title: "関連画面から深リンクを使う", body: "会員・注文・管理者の詳細から対象IDで絞り込んだ監査ログへ移動できる箇所があります。" },
    ],
  },
  {
    slug: "admin-incidents",
    role: "admin",
    category: "トラブル・通知",
    title: "エラー・障害通知が届いたとき",
    summary: "二重注文・二重入庫を防ぎながら、確認と担当者への引継ぎを行います。",
    audience: "本部担当者・管理者",
    steps: [
      { title: "まず更新操作を止める", body: "注文確定・出荷・請求書発行・在庫変更でエラーになった場合、同じ操作を繰り返さず、対象画面を残してください。", warning: "エラーやタイムアウトでもサーバー側では保存が完了している場合があります。" },
      { title: "履歴と現在の状態を確認する", body: "注文番号、注文状態、在庫数、入庫履歴などを再読み込みして確認します。別の担当者の操作もあり得るため、数値を自己判断で元に戻さないでください。" },
      { title: "障害IDと発生状況を引き継ぐ", body: "障害通知がある場合は通知全文を運用担当者またはこのシステムのCodexチャットへ渡します。通知がなくても、発生日時・画面・直前の操作・表示されたエラー・ブラウザを伝えてください。", warning: "パスワード・Token・Secretや顧客の住所等を貼らないでください。スクリーンショットの個人情報は隠してください。" },
      { title: "復旧後も保存結果を確認する", body: "復旧通知は稼働確認の連絡であり、直前の注文・入荷の保存完了を保証しません。履歴を確認し、未完了と確認できた操作だけを担当者と相談して再開します。" },
    ],
    tips: ["受注LINEと障害専用LINEは別です。通知が届かないことだけで正常とは判断できません。", "LINE連絡だけでCodexが自動起動して本番コードやDBを変更する機能ではありません。", "DB復元・在庫の巻戻し・注文再送は、運用担当者の判断と承認なしに行わないでください。"],
  },
  {
    slug: "admin-line-notifications",
    role: "admin",
    category: "トラブル・通知",
    title: "LINE通知が届かないとき",
    summary: "通知の種類、注文成立、グループと接続状態を順に確認します。",
    audience: "本部担当者・運用担当者",
    steps: [
      { title: "受注通知か障害通知かを分ける", body: "受注通知は新規注文の連絡、障害通知は稼働異常や復旧の連絡です。使用する公式アカウント・Token・通知先は別管理です。" },
      { title: "注文や保存の成立を画面で確認する", body: "通知がなくても注文が成立している場合があります。受注通知の場合は本部の注文一覧を確認してください。", warning: "LINEが届かないことを理由に同じ注文を作り直さないでください。" },
      { title: "グループと運用担当者へ確認する", body: "目的の公式アカウントが通知先グループに参加しているか確認し、運用担当者へ通知設定、署名検証、Token、有効フラグ、送信上限の確認を依頼してください。", note: "画面の機能フラグとLINE用の環境変数は別管理です。本部の機能フラグを自己判断で切り替えないでください。" },
      { title: "受信テストは担当者と調整する", body: "テスト通知は業務注文を作らず、運用担当者が専用の手順で単発送信し、グループ内の受信を確認します。APIの受付成功と端末での受信は区別してください。" },
    ],
    tips: ["このマニュアルの表示は、障害専用LINEの接続完了や常時監視を保証するものではありません。現在の稼働状況は運用担当者へ確認してください。"],
  },
];

export function searchManualArticles(articles: ManualArticle[], query: string, category = "") {
  const normalize = (value: string) => value.normalize("NFKC").toLocaleLowerCase("ja-JP");
  const terms = normalize(query).trim().split(/\s+/).filter(Boolean);
  return articles.filter((article) => {
    if (category && article.category !== category) return false;
    const text = normalize([article.title, article.summary, article.category, article.audience || "", ...article.steps.flatMap((step) => [step.title, step.body, step.note || "", step.warning || ""]), ...(article.tips || [])].join(" "));
    return terms.every((term) => text.includes(term));
  });
}

export function getManualArticles(role: ManualRole) {
  return role === "admin" ? adminManualArticles : memberManualArticles;
}

export function findManualArticle(role: ManualRole, slug: string) {
  return getManualArticles(role).find((article) => article.slug === slug);
}
