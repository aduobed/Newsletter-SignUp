const express = require("express");
const request = require("request");
const mailchimp = require("@mailchimp/mailchimp_marketing");
// const client = require("@mailchimp/mailchimp_marketing");
const app = express();
const port = 3000;

app.use(express.json());
app.use(express.urlencoded({ extended: false }));
app.use(express.static("public"));

app.use((req, res, next) => {
    mailchimp.setConfig({
        apiKey: "bdf4c41ee9fb39e2edfc63f1f377436f-us4",
        server: "us4",
    });
    next();
});

app.get("/", function (require, res) {
    res.sendFile(__dirname + "/signup.html");
});

app.post("/", function (req, res) {
    let firstName = req.body.fName;
    let lastName = req.body.lName;
    let email = req.body.email;
    let phone = req.body.phone;

    var data = {
        members: [
            {
                email_address: email,
                status: "subscribed",
                merge_fields: {
                    FNAME: firstName,
                    LNAME: lastName,
                    PHONE: phone,
                },
            },
        ],
    };

    let jsonData = JSON.stringify(data);
    console.log(jsonData);

    let options = {
        url: "https://us4.api.mailchimp.com/3.0/lists/6d9fcd41ae",
        method: "POST",
        headers: {
            "Content-type": "application/x-www-form-urlencoded; charset=UTF-8",
            Authorization: "obed bdf4c41ee9fb39e2edfc63f1f377436f-us4",
        },
        body: jsonData,
    };

    request(options, function (error, response, body) {
        if (error) {
            res.sendFile(__dirname + "/failure.html");
        } else if (response.statusCode === 200) {
            res.sendFile(__dirname + "/success.html");
        } else res.sendFile(__dirname + "/failure.html");
    });
});

app.post("/failure", function (req, res) {
    res.redirect("/");
});

app.listen(process.env.PORT || port, function () {
    console.log("listening on port 3000");
});
