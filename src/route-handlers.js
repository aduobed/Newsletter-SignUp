const { subscribeUser } = require("./api-utils");

exports.badGateway = (res) => {
  // TODO: Find a better approach to present this
    res.send("Bad Gateway");
}

exports.subcribeUsersHandler = (req, res) => {
  let firstName = req.body.fName;
  let lastName = req.body.lName;
  let email = req.body.email;
  let phone = req.body.phone;

  return subscribeUser(firstName, lastName, email, phone)
      .then(() => {
          res.render("shop");
      })
      .catch(() => {
          // TODO: Handle this cleaner
          res.redirect("/failure.html");
      })
}