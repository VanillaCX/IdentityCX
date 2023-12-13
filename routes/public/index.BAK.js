const express = require('express')
const router = express.Router()

const {Authenticator, User} = require("@VanillaCX/Identity");
const {ResourceError} = require("@VanillaCX/Errors")
const {StoreCX} = require("@VanillaCX/StoreCX");

router.use((req, res, next) => {
    console.group(`Public Access Request at :${Date.now()}`);
    console.log("req.session:", req.session);
    console.groupEnd();

    next()
})



/**********************************************************************
 * Home Page **********************************************************
 *********************************************************************/

router.get("/", (req, res) => {
    console.log("REQUEST[GET]: /");
    res.render("public/homepage");
})



/**********************************************************************
 * Sign-in ************************************************************
 *********************************************************************/

router.route("/sign-in")
    .get((req, res) => {
        console.log("REQUEST[GET]: /sign-in");
        res.render("public/authentication/sign-in");
    })
    .post(async (req, res, next) => {
        try {
            console.log("REQUEST[POST]: /sign-in");
            const formData = req.body;
            const username = formData.username;
            const password = formData.password;
    
            const user = await Authenticator.authenticate(username, password);

        
            req.session.userData = user.toJson();

            req.session.save(() => {
                if(user.hasRegisteredOTP) {
                    res.redirect("/two-factor-sign-in")
                } else {
                    // Save QRCode to session
                    res.redirect("/register-authenticator-app")
                }
            });
    
        } catch(error) {
            switch(error.message) {
                case "NO_SUCH_ACCOUNT":
                    res.render("public/authentication/sign-in", {errorMessage: "NO_SUCH_ACCOUNT"})
                    break;
                default:
                    res.render("public/authentication/sign-in", {errorMessage: "UNKNOWN_ERROR"})
                    break;
            }
        }
    })

router.route("/two-factor-sign-in")
    .get((req, res) => {
        console.log("TWO FACTOR SIGN IN PAGE [GET]", req.session);
        res.render("public/authentication/get-otp");
    })
    .post(async (req, res, next) => {
        console.log("TWO FACTOR SIGN IN PAGE [POST]", req.session);
        try {
            const formData = req.body;
            const otp = formData.otp;
    
            const user = new User(req.session.userData);
            const valid = user.OTP.check(otp);

            if(valid){
                req.session.authenticated = true;
                res.redirect("/account")
            } else {
                res.render("public/authentication/get-otp", {errorMessage: "INCORRECT_OTP"})
            }


        } catch(error) {
            switch(error.message) {
                default:
                    res.render("public/authentication/get-otp", {errorMessage: "UNKNOWN_ERROR"})
                    break;
            }
        }
    })

router.route("/register-authenticator-app")
    .get(async (req, res) => {
        if(req.session.userData){
            const user = new User(req.session.userData);
            const qrcode = await user.OTP.getQRCode();

            res.render("public/authentication/register-authenticator-app", {qrcode});

        } else {
            res.redirect("/sign-in")
        }

    })
    .post(async (req, res, next) => {
        
        try {
            const user = new User(req.session.userData);
            const formData = req.body;
            const otp = formData.otp;

            await user.registerOTP(otp);

            req.session.authenticated = true;

            req.session.save(() => {
                res.redirect('/account');
            });

        } catch(error) {
            console.log("CAUGHT AN ERROR");
            const user = new User(req.session.userData);
            const qrcode = await user.OTP.getQRCode();

            switch(error.message) {
                case "ALREADY_VALIDATED":
                    console.log("ALREADY VALUIDATED.....");
                    // Maybe go to authorised page instead.
                    res.redirect("/account");
                    break;
                case "INVALID_OTP":
                    console.log("INVALID_OTP");
                    res.render("public/authentication/register-authenticator-app", {errorMessage: "INVALID_OTP", qrcode})
                    break;
                default:
                    console.log("UNKNOWN ERROR", error);
                    res.render("public/authentication/register-authenticator-app", {errorMessage: "UNKNOWN_ERROR", qrcode})
                    break;
            }
        }
    })



/**********************************************************************
 * Sign-up ************************************************************
 *********************************************************************/

router.route("/sign-up")
    .get((req, res) => {
        res.render("public/authentication/sign-up");
    })
    .post(async (req, res, next) => {
        try {
            
            const formData = req.body;
            const action = formData.action;
            const username = formData.username;
            const password = formData.password;
            const screenname = formData.screenname || username;

            console.group("ATTEMPTING TP CREATE ACCOUNT");
            console.log({username, password, screenname});
            console.groupEnd();

            const user = await Authenticator.createAccount(username, password, screenname);
            req.session.userData = user.toJson();
    
            res.redirect("/register-authenticator-app")
    
        } catch(error){
            switch(error.message) {
                case "ACCOUNT_ALREADY_EXISTS":
                    res.render("public/authentication/sign-up", {errorMessage: "ACCOUNT_ALREADY_EXISTS"})
                    break;
                case "SchemaError":
                    res.render("public/authentication/sign-up", {errorMessage: "INVALID_FORM_DATA"})
                    break;
                default:
                    res.render("public/authentication/sign-up", {errorMessage: "UNKNOWN_ERROR"})
                    console.log(error)
                    break;
            }
        }
    })



/**********************************************************************
 * Recover Password ***************************************************
 *********************************************************************/

router.route("/recover-password")
    .get((req, res) => {
        res.render("public/authentication/recover-password");
    })
    //.post((req, res) => {
    //
    //})


/**********************************************************************
 * Recover Username ***************************************************
 *********************************************************************/

router.route("/recover-username")
    .get((req, res) => {
        res.render("public/authentication/recover-username");
    })
    //.post((req, res) => {
    //
    //})

/**********************************************************************
 * Recover Username ***************************************************
 *********************************************************************/

router.get("/sign-out", (req, res) => {
    console.log("req.session:", req.session);
    req.session.destroy((error) => {
        if (error) {
          console.log(err);
          const resourceErr = new ResourceError(req.originalUrl, 500);

          res.status(500)
            .render("errors/resource", {resourceErr})
        } else {
            console.log("killed sesssion..... req.session:", req.session);
          res.render("public/authentication/signed-out");
        }
      });
    
})


    

module.exports = router
