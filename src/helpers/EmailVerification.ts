import nodemailer, { SentMessageInfo } from 'nodemailer';
import { config } from '../config/config';
import Logger from '../library/logger';

export default class Mailer {
  receiver: string = '';
  email = {
    subject: '',
    text: ''
  };

  constructor (receiver: string, email: { subject: string, text: string }) {
    this.receiver = receiver;
    this.email = email;
  }

  transporter = nodemailer.createTransport({
    host: 'smtp.email.ua',
    port: 465,
    secure: true,
    requireTLS: true,
    auth: {
      user: config.email.login,
      pass: config.email.password
    },
    debug: true,
    logger: true
  });

  mailOptions () {
    return {
      from: 'memologist@email.ua',
      to: this.receiver,
      subject: this.email.subject,
      html: this.email.text
    };
  };

  async sendMail () {
    await this.transporter.sendMail(this.mailOptions(), function (error: Error | null, info: SentMessageInfo) {
      if (error) {
        Logger.err(error);
      } else {
        Logger.log('Email sent: ' + info.response);
      }
    });
  }
}
