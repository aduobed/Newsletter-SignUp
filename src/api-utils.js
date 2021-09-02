const md5 = require("md5");
const configuredMailchimp = require("./configured-mailchimp");
const { addSubscription } = require("./firebase-utils");

exports.subscribeUser = (firstName, lastName, email, phone) => {
  if (!firstName || !lastName || !email || !phone) {
    throw new Error("Invalid args to subscribeUser");
  }

  const memberHash = md5(email.toLowerCase());

  // Save to mailChimp list
  const mailChimpPromise = configuredMailchimp.lists.setListMember(
    process.env.MAILCHIMP_LIST_ID,
    memberHash,
    {
      email_address: email,
      status: "subscribed",
      merge_fields: {
        FNAME: firstName,
        LNAME: lastName,
        PHONE: phone,
      },
      timestamp_signup: new Date().toISOString(),
    }
  );

  // store in firebase as well
  const fireStorePromise = addSubscription(firstName, lastName, email, phone);

  const [mailchimpResult, _] = await Promise.all([mailChimpPromise, fireStorePromise]);

  return mailchimpResult;
};
