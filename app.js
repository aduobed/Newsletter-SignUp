const express = require("express");
const request = require("request");
const ejs = require("ejs");
const helmet = require("helmet");
const mailchimp = require("@mailchimp/mailchimp_marketing");
// const client = require("@mailchimp/mailchimp_marketing");
const cookieParser = require("cookie-parser");
const app = express();

const adminRoutes = require("./admin");
const port = 3000;

//Template engine - Ejs
app.set("view engine", "ejs");
app.set("views", "views");

// app.use
app.use(helmet());
app.use(cookieParser());
app.use(express.json());
app.use(express.urlencoded({ extended: false }));
app.use(express.static(__dirname + "/public"));

// Registering Admin Route
app.use("/admin", adminRoutes);

app.get("/", (req, res, next) => {
    res.render("shop");
});

app.post("/", (req, res) => {
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
            res.json({ name: "Error" });
        } else if (response.statusCode === 200) {
            res.render("shop");
        } else {
            res.json({ error: "There was an error" });
        }
    });
});

app.post("/failure", function (req, res) {
    res.redirect("/");
});

app.listen(process.env.PORT || port, function () {
    console.log("listening on port 3000");
});
