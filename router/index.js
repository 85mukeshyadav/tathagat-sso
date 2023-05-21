const express = require("express");

const router = express.Router();
const controller = require("../controller");
var cors = require('cors');

router.use(cors())

router
  .route("/login")
  .get(controller.login)
  .post(controller.doLogin);

router.get("/verifytoken", controller.verifySsoToken);
router.get("/logout",cors(), controller.logout);

router.get("/weblogout", controller.weblogout);

module.exports = router;
