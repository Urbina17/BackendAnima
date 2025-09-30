const nodemailer = require('nodemailer');

const transporter = nodemailer.createTransport({
  host: process.env.SMTP_HOST,
  port: Number(process.env.SMTP_PORT || 587),
  secure: false,
  auth: {
    user: process.env.SMTP_USER,
    pass: process.env.SMTP_PASS
  }
});

async function sendResetCode(to, code) {
  const info = await transporter.sendMail({
    from: process.env.EMAIL_FROM,
    to,
    subject: 'Código para restablecer contraseña',
    text: `Tu código para restablecer la contraseña es: ${code}. Expira en 1 hora.`,
    html: `<p>Tu código para restablecer la contraseña es: <b>${code}</b></p><p>Expira en 1 hora.</p>`
  });

  console.log("📩 Mensaje enviado:", info.messageId);

  // Si es Ethereal, muestra el preview URL
  const previewUrl = nodemailer.getTestMessageUrl(info);
  if (previewUrl) {
    console.log("🔗 Preview URL:", previewUrl);
  }

  return info;
}

module.exports = { sendResetCode };

