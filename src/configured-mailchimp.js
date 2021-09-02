const mailchimp = require("@mailchimp/mailchimp_marketing");

// Configure mailchimp once
mailchimp.setConfig({
  apiKey: process.env.MAILCHIMP_API_KEY,
  server: process.env.MAILCHIMP_API_KEY.split("-")[1], // server is always the end of the key preceded by "-"
});

module.exports = mailchimp;
