require("dotenv").config();
require("./src/configured-firebase");

const express = require("express");
const helmet = require("helmet");
const { check, validationResult } = require("express-validator");

const { subscribeUsersHandler } = require("./src/route-handlers");

const app = express();

const adminRoutes = require("./admin");
const port = 3000;

//Template engine - Ejs
app.set("view engine", "ejs");
app.set("views", "views");

// app.use
app.use(helmet());
app.use(express.json());
app.use(express.urlencoded({ extended: false }));
app.use(express.static(__dirname + "/public"));

// Registering Admin Route
app.use("/admin", adminRoutes);

app.get("/", (req, res, next) => {
    res.render("shop");
});

// Hit the subscribe button
app.post(
    "/",
    check("firstName", "At least First Name should not be empty").isEmpty(),
    check("lastName").isEmpty(),
    check("email", "Email - Must be a valid email").isEmail().normalizeEmail(),
    check("phone", "Phone - Must be numbers only").isNumeric(),
    (req, res) => {
        const errors = validationResult(req);
        if (!errors.isEmpty()) {
            const alert = errors.array();
            res.render("shop", {
                alert,
            });
        } else {
            subscribeUsersHandler(req, res);
        }
    }
);

app.listen(process.env.PORT || port, function () {
    console.log("listening on port 3000");
});

process.on("uncaughtException", (e) => {
    console.log(e);
});

process.on("unhandledRejection", (e) => {
    console.log(e);
});
