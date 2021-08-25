const md5 = require("md5");
const request = require("request");
const express = require("express");
const mailchimp = require("@mailchimp/mailchimp_marketing");
// const client = require("@mailchimp/mailchimp_marketing");
const router = express.Router();

router.use((req, res, next) => {
    mailchimp.setConfig({
        apiKey: "bdf4c41ee9fb39e2edfc63f1f377436f-us4",
        server: "us4",
    });
    next();
});

// Cookies
router.use((req, res, next) => {
    res.cookie("password", "1234");
    res.cookie("email", "fire");
    next();
});

// Admin index route to sign-in -> GET
router.get("/login", (req, res, next) => {
    res.render("admin-sign-in");
});
// Admin Route -> POST
router.post("/login", (req, res, next) => {
    let clientPassword = req.body.password;
    let clientEmail = req.body.email;
    const email = req.cookies.email;
    const passCode = req.cookies.password;
    console.log(passCode);
    if (clientPassword != passCode) {
        res.json({ msg: "Wrong Password!" });
    } else {
        res.redirect("/admin/dashboard");
        // res.sendFile(__dirname + "/public/Admin/admin.html");
    }
    console.log(req.body);

    // res.json({ msg: "Logged in Successfully" });
});

router.get("/dashboard", async (req, res, next) => {
    const data = async () => {
        try {
            // const response = await mailchimp.ping.get();
            // const list = await mailchimp.lists.getAllLists();
            // console.log(list);
            res.render("adminDashboard", {
                system: "hi", //response.health_status,
                list_id: "hi", //list.lists[0].id,
                list_name: "hi", //list.lists[0].name,
                date_created: "hi", //list.lists[0].date_created,
                permission_reminder: "hi", //list.lists[0].permission_reminder,
            });
        } catch (error) {
            console.log(error);
        }
    };

    data();
});

router.get("/table", async (req, res, next) => {
    const data = async () => {
        try {
            const mem = await mailchimp.lists.getListMembersInfo("6d9fcd41ae");
            console.log(mem);

            res.render("table", {
                members: mem.members,
                total_items: mem.total_items,
            });
        } catch (error) {
            console.log(error);
        }
    };

    data();
});

//Admin Add member to audience -> GET
router.get("/memberAddForm", (req, res, next) => {
    res.render("memberAddForm");
});

//Admin Add member to audience -> GET
router.post("/memberAddForm", async (req, res, next) => {
    const { fName, lName, email, phone } = req.body;
    const listId = req.body.listId;
    var data = {
        members: [
            {
                email_address: email,
                status: "subscribed",
                merge_fields: {
                    FNAME: fName,
                    LNAME: lName,
                    PHONE: phone,
                },
            },
        ],
    };

    let jsonData = JSON.stringify(data);
    console.log(jsonData);

    let options = {
        url: `https://us4.api.mailchimp.com/3.0/lists/${listId}`,
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
            res.render("memberAddForm");
        } else {
            res.json({ error: "There was an error" });
        }
    });
});

router.get("/memberInfo", (req, res, next) => {
    res.render("memberInfo");
});

router.post("/memberInfo", async (req, res, next) => {
    const listId = req.body.listId;
    const email = req.body.email;
    const subscriberHash = md5(email.toLowerCase());

    const data = async () => {
        try {
            const response = await mailchimp.lists.getListMember(
                listId,
                subscriberHash
            );
            res.render("memberInfoTable", {
                full_name: response.full_name,
                email_address: response.email_address,
                status: response.status,
                phone_number: response.merge_fields.PHONE,
                timestamp_opt: response.timestamp_opt,
            });
        } catch (error) {
            res.send(error);
        }
    };
    data();
});

// Admin update Member Route -> GET
router.get("/updateMemberInfo", (req, res, next) => {
    res.render("updateMemberInfo");
});

// Admin update Member Route -> PUT
router.post("/updateMemberInfo", (req, res, next) => {
    const listId = req.body.listId;
    const oldEmail = req.body.oldEmail;
    const newEmail = req.body.newEmail;
    const phone = req.body.phone;
    const subscriberHash = md5(oldEmail.toLowerCase());

    console.log(listId, oldEmail, newEmail, phone, subscriberHash);

    const data = async () => {
        try {
            const response = await mailchimp.lists.setListMember(
                listId,
                subscriberHash,
                { email_address: `${newEmail}`, status_if_new: "subscribed" }
            );
            res.render("memberInfoTable", {
                full_name: response.full_name,
                email_address: response.email_address,
                status: response.status,
                phone_number: phone,
                timestamp_opt: response.timestamp_opt,
            });
        } catch (error) {
            res.send(error);
        }
    };
    data();
});

// Admin Delete Member Route -> GET
router.get("/deleteMember", (req, res, next) => {
    res.render("deleteMember");
});

// Admin Delete Member Route -> GET
router.post("/deleteMember", (req, res, next) => {
    const listId = req.body.listId;
    const email = req.body.email;
    const subscriberHash = md5(email.toLowerCase());

    const data = async () => {
        try {
            const response = await mailchimp.lists.deleteListMember(
                listId,
                subscriberHash
            );
            console.log(response);
            res.render("memberDeletePage");
        } catch (error) {
            res.send(error);
        }
    };
    data();
});

module.exports = router;
