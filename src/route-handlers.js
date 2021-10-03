const { subscribeUser } = require("./api-utils");

exports.badGateway = (res) => {
    // Response for any catch error
    res.send("Sorry Bad Gateway, Please refresh again and try few minutes later...");
};

exports.subscribeUsersHandler = (req, res) => {
    let firstName = req.body.fName;
    let lastName = req.body.lName;
    let email = req.body.email;
    let phone = req.body.phone;

    try {
        subscribeUser(firstName, lastName, email, phone);
        if (req.path.includes("/memberAddForm")) {
            return res.redirect("/admin/dashboard");
        }
        res.render("shopSuccess");
    } catch (error) {
        console.log(error);
        res.redirect("/failure.html");
    }
};
