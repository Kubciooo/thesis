const nodemailer = require('nodemailer');
const HTTP_STATUS_CODES = require('../constants/httpStatusCodes');
const variables = require('../constants/variables');
const AppError = require('../services/error.service');

const Emails = (() => {
  const transporter = nodemailer.createTransport({ ...variables.transporter[process.env.NODE_ENV] });

  const send = async (userEmail, userForgotToken) => {
    const forgotPasswordRoute = `https://${variables.apiUrl[process.env.NODE_ENV]}/api/users/resetPassword/${userForgotToken}`;
    const mailOptions = {
      from: 'pawel@offprice.com',
      to: userEmail,
      subject: 'Pasword reset',
      text: `Forgot your password? No worries, we got you! To restart your password, just send a POST request to ${forgotPasswordRoute}`,
    };

    await transporter.sendMail(mailOptions, (err, info) => {
      if (err) {
        throw new AppError('EmailNotSentError', HTTP_STATUS_CODES.INTERNAL_SERVER, "Couldn't send an email! Try again later!");
      }
    });
  }

  return { send };
})();

module.exports = Emails;