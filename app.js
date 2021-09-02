require("dotenv").config();
require("./src/configured-firebase");

const express = require("express");
const helmet = require("helmet");
const cookieParser = require("cookie-parser");

const { subcribeUsersHandler } = require("./src/route-handlers");

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

// Hit the subscribe button
app.post("/", (req, res) => {
  subcribeUsersHandler(req, res);
});

app.post("/failure", function (req, res) {
  res.redirect("/");
});

app.listen(process.env.PORT || port, function () {
  console.log("listening on port 3000");
});

process.on("uncaughtException", (e) => {
  console.log(e);
});

process.on("unhandledRejection", (e) => {
  console.log(e);
});
