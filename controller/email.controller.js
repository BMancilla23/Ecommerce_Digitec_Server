const nodemailer = require('nodemailer')
const asyncHandler = require('express-async-handler')

// Función para enviar correos electrónicos usando nodemailer
const sendEmail = asyncHandler(async (data, req, res) => {
  // Crear un objeto de transporte para nodemailer con las credenciales de Gmail
  const transporter = nodemailer.createTransport({
    host: "smtp.gmail.com",
    port: 465,
    secure: true,
    auth: {
      // TODO: Reemplazar `user` y `pass` con valores válidos de https://forwardemail.net
      user: process.env.MAIL_ID,
      pass: process.env.MP,
    },
  });

  // Enviar un correo electrónico con el objeto de transporte definido
  const info = await transporter.sendMail({
    from: '"Hey 👻" <abc@example.com>', // Dirección del remitente
    to: data.to, // Lista de destinatarios
    subject: data.subject, // Asunto del correo
    text: data.text, // Cuerpo del correo en texto plano
    html: data.html, // Cuerpo del correo en formato HTML
  });

  // Imprimir el ID del mensaje en la consola después de enviar el correo
  console.log("Message sent: %s", info.messageId);
  // Mensaje enviado: <b658f8ca-6296-ccf4-8306-87d57a0b4321@example.com>

  //
  // NOTA: Puedes ir a https://forwardemail.net/my-account/emails para ver el estado de entrega y la vista previa del correo electrónico
  //       O puedes usar el paquete "preview-email" de npm para previsualizar correos electrónicos localmente en navegadores y iOS Simulator
  //       <https://github.com/forwardemail/preview-email>
  //
});

// Exportar la función sendEmail para su uso en otros archivos
module.exports = sendEmail;

