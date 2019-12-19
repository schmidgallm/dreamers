const dotenv = require('dotenv');
const mailgun = require('mailgun-js');

dotenv.config();

// init mailgun config
const mg = mailgun({
  apiKey: process.env.MAILGUN_API_KEY,
  domain: process.env.MAILGUN_DOMAIN
});

// prepare email
const data = {
  from: 'schmidgallm.10@gmail.com',
  to: 'schmidgallm.10@gmail.com',
  subject: 'Hello',
  text: 'Testing some Mailgun awesomness!'
};

// send email
mg.messages().send(data, function(error, body) {
  if (error) {
    console.log(error);
  }
  console.log(body);
});
