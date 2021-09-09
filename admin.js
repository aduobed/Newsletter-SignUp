const md5 = require("md5");
const express = require("express");
const { check, validationResult } = require("express-validator");
const mailchimp = require("./src/configured-mailchimp");
const {
    isUserSignedIn,
    signIn,
    signUp,
    getSubscriptions,
} = require("./src/firebase-utils.js");

const { badGateway, subscribeUsersHandler } = require("./src/route-handlers");

const router = express.Router();
const whiteListRoutes = ["/login", "/signup"];
// Check if user is authenticated
router.use((req, res, next) => {
    // exclude for GET /login & /SIGNUP
    if (!whiteListRoutes.includes(req.path) && !isUserSignedIn()) {
        return res.redirect("/admin/login");
    }
    next();
});

// Admin index route to sign-in -> GET
router.get("/login", (req, res) => {
    if (isUserSignedIn()) {
        return res.redirect("/admin/dashboard");
    }

    res.render("admin-sign-in", {
        pageTitle: "Admin Sign-In",
    });
});

// Admin Route -> POST
router.post(
    "/login",
    check("email", "Email - Please enter a valid email")
        .isEmail()
        .normalizeEmail(),
    check(
        "password",
        "Password - Enter your alphanumeric password"
    ).isStrongPassword(),
    async (req, res) => {
        const errors = validationResult(req);
        if (!errors.isEmpty()) {
            const alert = errors.array();
            res.render("admin-sign-in", {
                alert,
                pageTitle: "Admin Sign-In",
            });
        } else {
            const { email, password } = req.body;

            const signInSuccessful = await signIn(email, password);

            if (!signInSuccessful) {
                res.redirect("/admin/login?error=InvalidCredentials");
            } else {
                res.redirect("/admin/dashboard");
            }
        }
    }
);

// Admin index route to sign-up -> GET
router.get("/signup", (req, res) => {
    res.render("admin-signup", {
        pageTitle: "Admin Sign-Up",
        // error: req.query.error,
    });
});

// Admin index route to sign-up -> POST
router.post(
    "/signup",
    check("email", "Email - Please enter a valid email")
        .isEmail()
        .normalizeEmail(),
    check(
        "password",
        "Password - Enter a secured password!"
    ).isStrongPassword(),
    async (req, res) => {
        const errors = validationResult(req);
        if (!errors.isEmpty()) {
            const alert = errors.array();
            res.render("admin-sign-in", {
                alert,
                pageTitle: "Admin Sign-Up",
            });
        } else {
            const { email, password } = req.body;

            const signUpSuccessful = await signUp(email, password);

            if (signUpSuccessful) {
                res.redirect("/admin/login");
            } else {
                res.redirect("/admin/signup?error=InvalidCredentials");
            }
        }
    }
);

router.get("/dashboard", async (_, res) => {
    try {
        const [response, listDetail] = await Promise.all([
            mailchimp.ping.get(),
            mailchimp.lists.getAllLists(),
        ]);

        if (!listDetail || !listDetail.lists || !listDetail.lists.length) {
            throw new Error("No list found");
        }

        const list = listDetail.lists[0];

        res.render("adminDashboard", {
            system: response.health_status,
            list_id: list.id,
            list_name: list.name,
            date_created: list.date_created,
            permission_reminder: list.permission_reminder,
            pageTitle: "Admin DashBoard",
        });
    } catch (error) {
        badGateway(res);
    }
});

router.get("/table", async (_, res) => {
    try {
        const mem = await mailchimp.lists.getListMembersInfo(
            process.env.MAILCHIMP_LIST_ID,
            { "count": 1000 }
        );

        if (!mem) {
            throw new Error("No members info found");
        }
        res.render("table", {
            members: mem.members,
            total_items: mem.members.length,
            pageTitle: "All Contacts or Members",
        });
    } catch (error) {
        badGateway(res);
    }
});

//Admin Add member to audience -> GET
router.get("/memberAddForm", (_, res) => {
    res.render("memberAddForm", {
        pageTitle: "Add a Member",
    });
});

//Admin Add member to audience -> GET
router.post(
    "/memberAddForm",
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

router.get("/memberInfo", (req, res, next) => {
    res.render("memberInfo", {
        pageTitle: "Member Information",
    });
});

router.post("/memberInfo", async (req, res) => {
    const listId = req.body.listId;
    const email = req.body.email;
    const subscriberHash = md5(email.toLowerCase());

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
        badGateway(res);
    }
});

// Admin update Member Route -> GET
router.get("/updateMemberInfo", (req, res) => {
    res.render("updateMemberInfo", {
        pageTitle: "Update a Member",
    });
});

// Admin update Member Route -> PUT
router.post("/updateMemberInfo", async (req, res) => {
    const listId = req.body.listId;
    const oldEmail = req.body.oldEmail;
    const newEmail = req.body.newEmail;
    const phone = req.body.phone;

    if (!listId || !oldEmail || !newEmail || !phone) {
        throw new Error("Invalid args passed to updateMemberInfo");
    }

    const subscriberHash = md5(oldEmail.toLowerCase());

    try {
        const listMemberResponse = await mailchimp.lists.setListMember(
            listId,
            subscriberHash,
            { email_address: `${newEmail}`, status_if_new: "subscribed" }
        );

        res.render("memberInfoTable", {
            full_name: listMemberResponse.full_name,
            email_address: listMemberResponse.email_address,
            status: listMemberResponse.status,
            phone_number: phone,
            timestamp_opt: listMemberResponse.timestamp_opt,
        });
    } catch (error) {
        badGateway(res);
    }
});

// Admin Delete Member Route -> GET
router.get("/deleteMember", (req, res, next) => {
    res.render("deleteMember", {
        pageTitle: "Delete a Member",
    });
});

// Admin Delete Member Route -> GET
router.post("/deleteMember", async (req, res) => {
    const listId = req.body.listId;
    const email = req.body.email;

    // TODO: Validate incoming props

    const subscriberHash = md5(email.toLowerCase());

    try {
        const response = await mailchimp.lists.deleteListMember(
            listId,
            subscriberHash
        );
        console.log(response);
        res.render("memberDeletePage", {
            pageTitle: "Member Info Deleted",
        });
    } catch (error) {
        badGateway();
    }
});

// Admin Get Current Campaign Route -> GET
router.get("/viewCampaign", (_, res) => {
    res.render("viewCampaign", {
        pageTitle: "Current Campaign Info",
    });
});

// Admin Get Current Campaign Route -> POST
router.post("/viewCampaign", () => {
    throw new Error("Not implemented");
});

// Admin getQuery Route -> GET
router.get("/getQuery", (_, res) => {
    res.render("getQuery", {
        pageTitle: "Query Search Info",
    });
});

// Admin getQuery Route -> POST
router.post("/getQuery", async (req, res) => {
    const { days } = req.body;
    try {
        const membersQuery = await getSubscriptions(days);
        res.render("getQueryInfo", {
            members: membersQuery,
            pageTitle: "Query Search Info",
            total_items: membersQuery.length,
            days,
        });
    } catch (error) {
        console.log(error);
    }
});

module.exports = router;
