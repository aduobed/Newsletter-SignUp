const path = require("path");
const express = require("express");
const mailchimp = require("@mailchimp/mailchimp_marketing");
const client = require("@mailchimp/mailchimp_marketing");
const router = express.Router();

// Cookies
router.use((req, res, next) => {
    res.cookie("password", "1234");
    res.cookie("email", "fire");
    next();
});

// Admin index route to sign-in
router.get("/", (req, res, next) => {
    res.sendFile(__dirname + "/public/Admin/admin.html");
});

router.get("/login", (req, res, next) => {
    res.sendFile(__dirname + "/public/Admin/auth-normal-sign-in.html");
});

router.post("/login", (req, res, next) => {
    let clientPassword = req.body.password;
    let clientEmail = req.body.email;
    const email = req.cookies.email;
    const passCode = req.cookies.password;
    console.log(passCode);
    if (clientPassword != passCode) {
        res.json({ msg: "Wrong Password!" });
    } else {
        res.sendFile(__dirname + "/public/Admin/admin.html");
    }
    console.log(req.body);

    // res.json({ msg: "Logged in Successfully" });
});

module.exports = router;
