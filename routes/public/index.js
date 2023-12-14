const express = require('express')
const router = express.Router()

const {Authenticator, User} = require("@VanillaCX/Identity");
const {StoreCX} = require("@VanillaCX/Store");

router.use((req, res, next) => {
    next()
})

// Redirect authorised users to /account page. Used as a router method.
const blockSignedInUsers = (req, res, next) => {
    const sessionStore = new StoreCX(req, "sessionStore");
    const isAuthenticated = sessionStore.get("authenticated");

    if(isAuthenticated){
        res.redirect("/account")
    } else {
        next();
    }
}



/**********************************************************************
 * Home Page **********************************************************
 *********************************************************************/

router.get("/", (req, res) => {
    res.render("public/homepage");
})



/**********************************************************************
 * Sign-in ************************************************************
 *********************************************************************/

router.route("/sign-in")
    .all(blockSignedInUsers)
    .get((req, res) => {
        res.render("public/authentication/sign-in");
    })
    .post(async (req, res, next) => {
        try {
            // Get form variables from request body
            const form = req.body;
            const username = form.username;
            const password = form.password;

            // Throw error if no username supplied
            if(!username){
                throw new ReferenceError("USERNAME");
            }

            // Throw error if no password supplied
            if(!password){
                throw new ReferenceError("PASSWORD");
            }

            // Authenticate user (Authenticator will throw error if unable to authenticate credentials)
            const user = await Authenticator.authenticate(username, password);

            // Create a session store and save users data
            const sessionStore = new StoreCX(req, "sessionStore");
            await sessionStore.set("user", user.toJson());

            // Check if user has registered an Authenticator App for MFA.
            if(user.hasRegisteredOTP){
                res.redirect("/two-factor-sign-in")
            } else {
                res.redirect("/register-authenticator-app")
            }

        } catch(error){
            console.log("Error Creating New User", error);
        }
        
    })

/**********************************************************************
 * TWO FACTOR SIGN IN *************************************************
 *********************************************************************/

router.route("/two-factor-sign-in")
    .all(blockSignedInUsers)
    .get((req, res) => {
        res.render("public/authentication/get-otp");

    })
    .post(async (req, res, next) => {
        try {
            // Create StoreCX class instance to manipulate "sessionStore"
            const sessionStore = new StoreCX(req, "sessionStore");

            // Create User class instance to manipulate user account
            const user = new User(sessionStore.get("user"));

            // Collect form variables
            const form = req.body;
            const otp = form.otp;


            // Throw error if no otp supplied
            if(!otp){
                throw new ReferenceError("OTP")
            }

            // Check if the otp supplied by user is valid
            const valid = user.OTP.check(otp);

            // Invalid otp. Handle error below
            if(!valid){
                throw new Error("INVALID_OTP");
            }

            // OTP is valid so set user as authenticated
            await sessionStore.set("authenticated", true);

            // Display main page for authenticated users
            res.redirect("/account");
            
        } catch(error){
            console.log(error);
        }
    })


/**********************************************************************
 * Register Authenticator App *****************************************
 *********************************************************************/

router.route("/register-authenticator-app")
    .all(blockSignedInUsers)
    .get(async (req, res) => {
        try {
            const sessionStore = new StoreCX(req, "sessionStore");
            const user = new User(sessionStore.get("user"));
            const qrcode = await user.OTP.getQRCode();

            res.render("public/authentication/register-authenticator-app", {qrcode});

        } catch(error) {
            console.log(error);
        }
    })
    .post(async (req, res, next) => {
        try {
            const sessionStore = new StoreCX(req, "sessionStore");
            const user = new User(sessionStore.get("user"));

            const form = req.body;
            const otp = form.otp;

            if(!otp){
                throw new Error("MISSING_OTP")
            }

            await user.registerOTP(otp);

            await sessionStore.set("authenticated", true);

            res.redirect("/account");

            
        } catch(error){
            console.log(error);
        }
    })



/**********************************************************************
 * Sign-up ************************************************************
 *********************************************************************/

router.route("/sign-up")
    .all(blockSignedInUsers)
    .get((req, res) => {
        res.render("public/authentication/sign-up");
    })
    .post(async (req, res, next) => {
        try {
            const form = req.body;
            const username = form.username;
            const password = form.password;
            const screenname = form.screenname || username;

            if(!username || !password || !screenname){
                res.send("MISSING DATA")
            }

            const user = await Authenticator.createAccount(username, password, screenname);

            // Create a session store and save users data
            const sessionStore = new StoreCX(req, "sessionStore");
            await sessionStore.set("user", user.toJson());

            res.redirect("/register-authenticator-app");

        } catch(error){
            console.log("Error Creating New User", error);
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
 * Sign out ***********************************************************
 *********************************************************************/

router.get("/sign-out", async (req, res) => {
    await StoreCX.killSession(req);
    res.render("public/authentication/signed-out");
})

module.exports = router
