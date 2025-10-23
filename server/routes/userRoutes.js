const express = require("express");
const router = express.Router();
const { addUser } = require("../controllers/userController");

router.post("/add", addUser);

module.exports = router;
