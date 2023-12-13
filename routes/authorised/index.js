const express = require('express')
const router = express.Router()
const {User} = require("@VanillaCX/Identity");
const {StoreCX} = require("@VanillaCX/StoreCX");

const blockGuests = (req, res, next) => {
    const sessionStore = new StoreCX(req, "sessionStore");
    const isAuthenticated = sessionStore.get("authenticated");

    if(!isAuthenticated){
        res.redirect("/sign-in")
    } else {
        next();
    }
}

router.use(blockGuests);

/**********************************************************************
 * Home Page **********************************************************
 *********************************************************************/

router.get("/", (req, res) => {
    const sessionStore = new StoreCX(req, "sessionStore");
    const user = new User(sessionStore.get("user"));

    res.render("authorised/homepage", {screenname: user.screenname});
})

module.exports = router
