'use strict';

const nodemailer = require('nodemailer');
const config = require('../config/env');

let transporter = null;

function getTransporter() {
  if (transporter) return transporter;

  if (!config.email.user || !config.email.pass) {
    transporter = nodemailer.createTransport({
      host: 'smtp.ethereal.email',
      port: 587,
      secure: false,
      auth: {
        user: process.env.ETHEREAL_USER || 'ethereal.user@ethereal.email',
        pass: process.env.ETHEREAL_PASS || 'ethereal.pass',
      },
    });
    return transporter;
  }

  transporter = nodemailer.createTransport({
    host: config.email.host,
    port: config.email.port,
    secure: config.email.secure,
    auth: {
      user: config.email.user,
      pass: config.email.pass,
    },
  });

  return transporter;
}

async function sendVerificationEmail(to, token) {
  const transport = getTransporter();
  const verifyUrl = `${config.app.baseUrl}/auth/verify/${token}`;

  const info = await transport.sendMail({
    from: config.email.from,
    to,
    subject: 'TopicGym - Verifica tu correo electrónico',
    html: `
      <div style="font-family: Arial, sans-serif; max-width: 600px; margin: auto;">
        <h2>¡Bienvenido a TopicGym!</h2>
        <p>Gracias por registrarte. Para activar tu cuenta, verifica tu correo electrónico haciendo clic en el siguiente botón:</p>
        <p style="text-align: center; margin: 32px 0;">
          <a href="${verifyUrl}" style="background: #2563eb; color: #fff; padding: 12px 24px; text-decoration: none; border-radius: 6px;">
            Verificar correo
          </a>
        </p>
        <p>Si el botón no funciona, copia y pega este enlace en tu navegador:</p>
        <p><a href="${verifyUrl}">${verifyUrl}</a></p>
        <p style="color: #6b7280; font-size: 12px;">Si no creaste esta cuenta, puedes ignorar este correo.</p>
      </div>
    `,
    text: `Verifica tu cuenta en TopicGym: ${verifyUrl}`,
  });

  if (config.nodeEnv !== 'production') {
    const previewUrl = nodemailer.getTestMessageUrl(info);
    if (previewUrl) {
      console.log(`[email.service] Preview URL: ${previewUrl}`);
    }
  }

  return info;
}

module.exports = { sendVerificationEmail };
