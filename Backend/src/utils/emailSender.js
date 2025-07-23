// utils/emailSender.js
//Funcion para envio de correos electronicos
const transporter = require('../../config/nodemailer');

const sendEmail = async (to, subject, text) => {
  try {
    const mailOptions = { from: process.env.EMAIL_USER, to, subject, text };
    await transporter.sendMail(mailOptions);
    console.log(`Correo enviado exitosamente a ${to}`);
  } catch (error) {
    console.error(`Error al enviar correo a ${to}:`, error);
  }
};
module.exports = sendEmail;