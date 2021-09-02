const md5 = require("md5");
const express = require("express");
const mailchimp = require("./src/configured-mailchimp");
const { isUserSignedIn, signIn } = require("./src/firebase-utils.js");

const { badGateway, subcribeUsersHandler } = require("./src/route-handlers");

const router = express.Router();

// Check if user is authenticated
router.use((req, res, next) => {
  // exclude for GET /login
  if (req.path.indexOf("/login") < 0 && !isUserSignedIn()) {
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
    error: req.query.error,
  });
});

// Admin Route -> POST
router.post("/login", async (req, res) => {
  const { email, password } = req.body;

  const signInSuccessful = await signIn(email, password);

  if (!signInSuccessful) {
    res.redirect("/admin/login?error=InvalidCredentials");
  } else {
    res.redirect("/admin/dashboard");
  }
});

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
      process.env.MAILCHIMP_LIST_ID
    );

    if (!mem) {
      throw new Error("No members info found");
    }

    res.render("table", {
      members: mem.members,
      total_items: mem.total_items,
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
router.post("/memberAddForm", async (req, res) => {
  subcribeUsersHandler(req, res);
});

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
    res.render("memberDeletePage");
  } catch (error) {
    badGateway();
  }
});

// Admin All Audience Route -> GET
router.get("/getAudience", (_, res) => {
  res.render("getAudience", {
    pageTitle: "Audience Info",
  });
});

// Admin All Audience Route -> POST
router.post("/getAudience", () => {
  throw new Error("Not implemented");
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

module.exports = router;
