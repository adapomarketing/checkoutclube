import nodemailer from 'nodemailer';

// O remetente oficial configurado nas variáveis de ambiente
export const MAIL_USER = process.env.GMAIL_USER;
const MAIL_PASS = process.env.GMAIL_APP_PASSWORD;

export const mailer = nodemailer.createTransport({
  service: 'gmail',
  auth: {
    user: MAIL_USER,
    pass: MAIL_PASS,
  },
});

export async function sendEmail({
  to,
  subject,
  html,
}: {
  to: string;
  subject: string;
  html: string;
}) {
  if (!MAIL_USER || !MAIL_PASS) {
    console.warn('⚠️ GMAIL_USER ou GMAIL_APP_PASSWORD não configurados. E-mail não enviado.');
    return;
  }

  return mailer.sendMail({
    from: `"Aliança dos Ventos" <${MAIL_USER}>`,
    to,
    subject,
    html,
  });
}
