// Email to customers, through the SMTP server in SMTP_URL (for example
// smtps://user:app-password@smtp.gmail.com:465). Links in emails start with APP_URL, the
// storefront's address. Without SMTP_URL, development prints each email to the console instead.
import nodemailer from 'nodemailer';

let transport;

const isProduction = () => process.env.NODE_ENV === 'production';

// Whether emails can go out. In production that needs both SMTP_URL and APP_URL.
export const mailReady = () => !isProduction() || Boolean(process.env.SMTP_URL && process.env.APP_URL);

export const appUrl = () => process.env.APP_URL ?? 'http://localhost:5173';

export async function sendMail({ to, subject, text }) {
  if (!process.env.SMTP_URL) {
    console.log(`\n[email to ${to}] ${subject}\n${text}\n`);
    return;
  }
  transport ??= nodemailer.createTransport(process.env.SMTP_URL);
  await transport.sendMail({ from: process.env.MAIL_FROM ?? 'YourEcom <hello@yourecom.in>', to, subject, text });
}
