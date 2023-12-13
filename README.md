# ExpressTemplate

1) Clone Repo
2) Create .env file with following params:
    EXPRESS_SERVER_PORT=8080
3) Run
    > npm install






    signup
        get: Sign up form
        post:
            sign up
            create session 
            redirect to register OTP

    register OTP
        get display QRCode
        post:
            if code is correct
                save as registered
                re direct to authorozed page
            if incorrect 
                redirect to register OTP and repeat