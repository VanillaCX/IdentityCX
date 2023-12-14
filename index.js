require('dotenv').config();

const path = require('path');
const cors = require('cors');

const {StoreCX} = require("@VanillaCX/Store");
const {ResourceError} = require("@VanillaCX/Errors");

const express = require("express");
const helmet = require("helmet");

// Entry point routes
const publicRoute = require(path.join(__dirname, 'routes', 'public'));
const authorisedRoute = require(path.join(__dirname, 'routes', 'authorised'));

// Set port the app listens to
const port = process.env.PORT || 3000;

// Create app
const app = express();

// Enable CORS for all routes
app.use(cors({ 
    origin: ['https://id.vanilla.cx', 'https://matter.cx'], 
    credentials: true 
}));

// Set Helmet usage for security
// app.use(helmet());

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
app.use(async (req, res, next) => {
    console.log(req.session);
    
    next();
})

// Setup entry point routing
app.use("/", publicRoute)
app.use("/account", authorisedRoute)

// Fallback for un-matched requests
app.use((req, res) => {
    // Requested resource doesnt exist. Return a 404
    const resourceErr = new ResourceError(req.originalUrl, 404);

    res.status(resourceErr.status.code)
       .render("common/errors/resource", {resourceErr})
})

app.listen(port, () => console.log(`Server listening on port: ${port}`));