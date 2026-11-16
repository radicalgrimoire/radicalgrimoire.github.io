function doPost(e) {
  const properties = PropertiesService.getScriptProperties();
  const recipient = properties.getProperty('RECIPIENT_EMAIL');
  const secret = properties.getProperty('RECAPTCHA_SECRET');
  const allowedHostname = properties.getProperty('ALLOWED_HOSTNAME');

  if (!recipient || !secret || !allowedHostname) {
    return resultPage('フォームの設定が不足しています。管理者に連絡してください。', false);
  }

  const params = e && e.parameter ? e.parameter : {};
  const name = String(params.name || '').trim();
  const email = String(params.email || '').trim();
  const message = String(params.message || '').trim();
  const honeypot = String(params.website || '').trim();
  const captchaToken = String(params['g-recaptcha-response'] || '');

  if (honeypot) {
    return resultPage('送信内容を確認できませんでした。フォームから再度お試しください。', false);
  }
  if (!name || name.length > 100 || !email || email.length > 254
      || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)
      || !message || message.length > 5000) {
    return resultPage('入力内容に不備があります。フォームに戻って確認してください。', false);
  }
  if (!captchaToken || captchaToken.length > 4096) {
    return resultPage('reCAPTCHAを完了してから、もう一度送信してください。', false);
  }

  const verification = verifyRecaptcha(captchaToken, secret, allowedHostname);
  if (!verification.ok) {
    return resultPage(verification.message, false);
  }

  try {
    MailApp.sendEmail({
      to: recipient,
      replyTo: email,
      subject: 'メール送信テストフォームからのメッセージ',
      body: 'お名前: ' + name + '\nメールアドレス: ' + email + '\n\n' + message,
    });
  } catch (error) {
    console.error('Test form email delivery failed: ' + String(error));
    return resultPage('メールを送信できませんでした。時間をおいて再度お試しください。', false);
  }

  return resultPage('テストメールを送信しました。受信箱をご確認ください。', true);
}

function verifyRecaptcha(token, secret, allowedHostname) {
  try {
    const response = UrlFetchApp.fetch('https://www.google.com/recaptcha/api/siteverify', {
      method: 'post',
      payload: { secret: secret, response: token },
      muteHttpExceptions: true,
    });
    if (response.getResponseCode() !== 200) {
      return { ok: false, message: 'reCAPTCHAの確認に失敗しました。時間をおいて再度お試しください。' };
    }

    const result = JSON.parse(response.getContentText());
    if (result.success !== true
        || String(result.hostname || '').toLowerCase() !== allowedHostname.toLowerCase()) {
      return { ok: false, message: 'reCAPTCHAを確認できませんでした。ページを再読み込みして再度お試しください。' };
    }
    return { ok: true, message: '' };
  } catch (error) {
    console.error('reCAPTCHA verification failed: ' + String(error));
    return { ok: false, message: 'reCAPTCHAの確認に失敗しました。時間をおいて再度お試しください。' };
  }
}

function resultPage(message, success) {
  const title = success ? '送信完了' : '送信できませんでした';
  const color = success ? '#3fb950' : '#f85149';
  const html = '<!doctype html><html lang="ja"><head><meta charset="utf-8">'
    + '<meta name="viewport" content="width=device-width, initial-scale=1">'
    + '<title>' + title + '</title><style>'
    + 'body{margin:0;padding:2rem;background:#212228;color:#fff;font:16px/1.6 sans-serif}'
    + 'main{max-width:38rem;margin:10vh auto;padding:2rem;border-top:4px solid ' + color + ';background:#2b2c33}'
    + 'h1{font-size:1.5rem}p{margin-bottom:0}</style></head><body><main>'
    + '<h1>' + title + '</h1><p>' + message + '</p>'
    + '<p>このタブを閉じてフォームに戻ってください。</p>'
    + '</main></body></html>';
  return HtmlService.createHtmlOutput(html);
}
