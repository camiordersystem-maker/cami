import { Resend } from "resend";

const resend = new Resend(process.env.RESEND_API_KEY);
const FROM = process.env.RESEND_FROM ?? "noreply@localhost";
const isDev = process.env.RESEND_API_KEY === "re_dummy_local_dev";
const isStaging = process.env.VERCEL_ENV === "preview" || process.env.APP_ENV === "staging";
const stagingEmailMode = process.env.STAGING_EMAIL_MODE ?? "suppress";
const stagingTestRecipient = process.env.STAGING_EMAIL_TO;

// User-supplied values (company names etc.) must not inject HTML into emails.
function esc(value: string): string {
  return value
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;");
}

async function send(to: string, subject: string, html: string) {
  if (isDev) {
    console.log("\n[DEV EMAIL]", { to, subject });
    return;
  }
  if (isStaging) {
    if (stagingEmailMode === "redirect" && stagingTestRecipient) {
      await resend.emails.send({
        from: FROM,
        to: stagingTestRecipient,
        subject: `[STAGING redirect:${to}] ${subject}`,
        html,
      });
    } else {
      console.log("staging_email_suppressed", { to, subject });
    }
    return;
  }
  await resend.emails.send({ from: FROM, to, subject, html });
}

export async function sendOrderConfirmation(params: {
  to: string;
  companyName: string;
  orderNo: string;
  total: number;
}) {
  const { to, companyName, orderNo, total } = params;
  const formatted = new Intl.NumberFormat("ja-JP", { style: "currency", currency: "JPY" }).format(total);
  await send(
    to,
    `【Cami】ご注文を承りました（${orderNo}）`,
    `<p>${esc(companyName)} 御中</p>
     <p>ご注文ありがとうございます。<br>
     注文番号：<strong>${orderNo}</strong><br>
     合計金額：<strong>${formatted}</strong></p>
     <p>確認でき次第、担当者よりご連絡いたします。</p>
     <p>Cami 本部</p>`
  );
}

export async function sendMemberApproved(params: {
  to: string;
  companyName: string;
}) {
  const { to, companyName } = params;
  await send(
    to,
    "【Cami】会員登録が承認されました",
    `<p>${esc(companyName)} 御中</p>
     <p>会員登録が承認されました。ログインしてご注文いただけます。</p>
     <p>Cami 本部</p>`
  );
}

export async function sendMemberRejected(params: {
  to: string;
  companyName: string;
}) {
  const { to, companyName } = params;
  await send(
    to,
    "【Cami】会員登録について",
    `<p>${esc(companyName)} 御中</p>
     <p>ご登録いただきありがとうございます。<br>
     誠に申し訳ございませんが、今回は審査の結果、ご登録をお断りさせていただく運びとなりました。<br>
     詳細につきましてはお問い合わせください。</p>
     <p>Cami 本部</p>`
  );
}

export async function sendNewMemberNotification(params: {
  companyName: string;
  contactName: string;
  email: string;
}) {
  const adminEmail = process.env.ADMIN_EMAIL ?? "admin@cami.co.jp";
  const { companyName, contactName, email } = params;
  await send(
    adminEmail,
    `【Cami管理】新規会員登録申請：${companyName}`,
    `<p>新規会員登録申請が届きました。</p>
     <p>会社名：${esc(companyName)}<br>担当者：${esc(contactName)}<br>メール：${esc(email)}</p>
     <p>管理画面から審査してください。</p>`
  );
}

export async function sendLowStockAlert(params: {
  productName: string;
  availableBoxes: number;
  threshold: number;
}) {
  const adminEmail = process.env.ADMIN_EMAIL ?? "admin@cami.co.jp";
  const { productName, availableBoxes, threshold } = params;
  await send(
    adminEmail,
    `【Cami】在庫残少アラート：${productName}`,
    `<p>在庫が少なくなっています。</p>
     <p>商品名：<strong>${esc(productName)}</strong><br>
     現在在庫：<strong>${availableBoxes}箱</strong>（アラート閾値：${threshold}箱）</p>
     <p>管理画面から在庫を補充してください。</p>
     <p>Cami 管理システム</p>`
  );
}

export async function sendPaymentOverdueAlert(params: {
  to: string;
  companyName: string;
  invoiceNo: string;
  total: number;
}) {
  const { to, companyName, invoiceNo, total } = params;
  const formatted = new Intl.NumberFormat("ja-JP", { style: "currency", currency: "JPY" }).format(total);
  await send(
    to,
    `【Cami】お支払い期限超過のお知らせ（${invoiceNo}）`,
    `<p>${esc(companyName)} 御中</p>
     <p>下記請求書のお支払い期限を過ぎております。ご確認のうえ、お早めのお手続きをお願いいたします。</p>
     <p>請求書番号：<strong>${invoiceNo}</strong><br>
     ご請求金額：<strong>${formatted}</strong></p>
     <p>すでにお支払い済みの場合は、行き違いにてご容赦ください。</p>
     <p>Cami 本部</p>`
  );
}

export async function sendInvoiceEmail(params: {
  to: string;
  companyName: string;
  invoiceNo: string;
  total: number;
  viewUrl: string;
}) {
  const { to, companyName, invoiceNo, total, viewUrl } = params;
  const formatted = new Intl.NumberFormat("ja-JP", { style: "currency", currency: "JPY" }).format(total);
  await send(
    to,
    `【Cami】請求書を送付いたします（${invoiceNo}）`,
    `<p>${esc(companyName)} 御中</p>
     <p>請求書を送付いたします。下記リンクよりご確認・印刷（PDF保存）いただけます。</p>
     <p>請求書番号：<strong>${invoiceNo}</strong><br>
     ご請求金額：<strong>${formatted}</strong></p>
     <p><a href="${esc(viewUrl)}">請求書を確認する</a></p>
     <p>Cami 本部</p>`
  );
}

export async function sendAnnouncementEmail(params: {
  to: string;
  companyName: string;
  title: string;
  body: string;
}) {
  const { to, companyName, title, body } = params;
  await send(
    to,
    `【Cami】お知らせ：${title}`,
    `<p>${esc(companyName)} 御中</p>
     <p><strong>${esc(title)}</strong></p>
     <p style="white-space: pre-wrap;">${esc(body)}</p>
     <p>Cami 本部</p>`
  );
}
