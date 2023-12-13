require('dotenv').config();

const {StoreCX} = require("@VanillaCX/StoreCX");
const {ResourceError} = require("@VanillaCX/Errors");

const express = require("express");
const helmet = require("helmet");

// Entry point routes
const publicRoute = require("./routes/public");
const authorisedRoute = require("./routes/authorised");

// Set port the app listens to
const port = process.env.EXPRESS_SERVER_PORT || 3000;

// Create app
const app = express();

// Set Helmet usage for security
app.use(helmet());

// Remove fingerprinting of the Server Software
app.disable('x-powered-by');

// Set EJS as templating engine  
app.set('view engine', 'ejs');  

// Enables static access to filesystem
app.use('/public', express.static('public'));

// Mongo DB Session Storage
app.use(StoreCX.session)

// Parse application/x-www-form-urlencoded
app.use(express.urlencoded({ extended: false }));

// Parse application/json
app.use(express.json());

// Middleware for all requests
app.use((req, res, next) => {
    next();
})

// Setup entry point routing
app.use("/", publicRoute)
app.use("/account", authorisedRoute)

// Fallback for un-matched requests
app.use((req, res) => {
    console.group(`REQUEST NOT COVERED`);
    console.log("req.originalUrl:", req.originalUrl);
    console.groupEnd();

    const resourceErr = new ResourceError(req.originalUrl, 404);

    res.status(resourceErr.status.code)
       .render("errors/resource", {resourceErr})
})

app.listen(port, () => console.log(`Server listening on port: ${port}`));