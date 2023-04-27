const uuidv4 = require("uuid/v4");
const Hashids = require("hashids");
const URL = require("url").URL;
const hashids = new Hashids();
const {genJwtToken} = require("./jwt_helper");
const {token} = require("morgan");
var jwt = require('jsonwebtoken');

const re = /(\S+)\s+(\S+)/;


var db = require('../config/db');
const {getLoginUser} = require("../helper/helper");


const alloweOrigin = {
    "http://localhost:3020": true, "http://localhost:3030": true, "http://localhost:3080": true
};

const deHyphenatedUUID = () => uuidv4().replace(/-/gi, "");
const encodedId = () => hashids.encodeHex(deHyphenatedUUID());

// A temporary cahce to store all the application that has login using the current session.
// It can be useful for variuos audit purpose
const sessionUser = {};
const sessionApp = {};

const originAppName = {
    "http://localhost:3020": "sso_consumer", "http://localhost:3030": "simple_sso_consumer"
};


const tokenCreate = userId => {

    let jwtSecretKey = process.env.JWT_SECRET_KEY;
    let data = {
        time: Date(), type: "tathagat-api",
    }
    const token = jwt.sign(data, jwtSecretKey, {expiresIn: process.env.TOKEN_TIME});
    console.log(token, process.env.TOKEN_TIME);
    if (token) {
        return token;
    } else {
        return ""
    }

}


const verifySsoToken = async (req, res, next) => {

    let tokenHeaderKey = process.env.TOKEN_HEADER_KEY;
    let jwtSecretKey = process.env.JWT_SECRET_KEY;

    console.log(req.query.ssoToken, req.sessionID)

    try {
        const token = req.query.ssoToken
        const verified = jwt.verify(req.query.ssoToken, jwtSecretKey);
        console.log("verified", verified)
        if (verified) {
            return res.status(200).send({token});
        } else {
            // Access Denied
            return res.status(401).send({
                status: 401, message: error
            });
        }
    } catch (error) {
        // Access Denied
        return res.status(401).send({
            status: 401, message: error
        });
    }
};
const doLogin = async (req, res, next) => {
    console.log("Login", req.body, req.sessionID)
    // do the validation with email and password
    // but the goal is not to do the same in this right now,
    // like checking with Datebase and all, we are skiping these section
    const {email, password} = req.body;

    const token = await tokenCreate(email)
    console.log("token", token)

    // else redirect
    const {serviceURL} = req.query;
    const id = encodedId();
    req.session.user = token;
    sessionUser[id] = email;
    if (serviceURL == null) {
        return res.redirect("/");
    }
    const url = new URL(serviceURL);
    console.log("url", url)

    req.db = db;
    var tokenUser = getLoginUser(req);

    if (tokenUser.status == 200) {
        console.log(tokenUser)
        return res.redirect(`${serviceURL}?ssoToken=${tokenUser.token}`);
    } else {
        return res.redirect("/login");
    }

};

const login = (req, res, next) => {

    // The req.query will have the redirect url where we need to redirect after successful
    // login and with sso token.
    // This can also be used to verify the origin from where the request has came in
    // for the redirection
    const {serviceURL} = req.query;
    // direct access will give the error inside new URL.
    if (serviceURL != null) {
        const url = new URL(serviceURL);
        if (alloweOrigin[url.origin] !== true) {
            return res
                .status(400)
                .json({message: "Your are not allowed to access the sso-server"});
        }
    }
    if (req.session.user != null && serviceURL == null) {
        return res.redirect("/");
    }
    // if global session already has the user directly redirect with the token
    if (req.session.user != null && serviceURL != null) {
        const url = new URL(serviceURL);
        const intrmid = encodedId();
        storeApplicationInCache(url.origin, req.session.user, intrmid);
        return res.redirect(`${serviceURL}?ssoToken=${intrmid}`);
    }

    return res.render("login", {
        title: "SSO-Server | Login"
    });
};

module.exports = Object.assign({}, {doLogin, login, verifySsoToken});
