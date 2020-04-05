const express = require("express");
const bodyParser = require("body-parser");
const request = require("request");
const app = express();
const port = 3000;

app.use(express.static("public"));
app.use(bodyParser.urlencoded({ extended: true }));

app.get("/", function (require, res) {
  res.sendFile(__dirname + "/signup.html");
});

app.post("/", function (req, res) {

  let firstName = req.body.fName;
  let lastName = req.body.lName;
  let email = req.body.email;

  var data = {
    members: [
      {
        email_address: email,
        status: "subscribed",
        merge_fields: {
          FNAME: firstName,
          LNAME: lastName
        }
      }
    ]
  };

  let jsonData = JSON.stringify(data);

  let options = {
    url: "https://us4.api.mailchimp.com/3.0/lists/6d9fcd41ae",
    method: "POST",
    headers: {
      "Authorization": "obed a61b9d61663a5d9e7b60228fae4d0ea8-us4"
    },
    body: jsonData
  };

  request(options, function (error, response, body) {
    if (error) {
      res.sendFile(__dirname + "/failure.html");
    } else if (response.statusCode === 200) {
      res.sendFile(__dirname + "/success.html");
    } else
      res.sendFile(__dirname + "/failure.html");
  });

});

app.post("/failure", function (req, res) {
  res.redirect("/");
});

app.listen(process.env.PORT || port, function () {
  console.log("listening on port 3000");
});

