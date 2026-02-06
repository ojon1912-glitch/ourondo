const express = require("express");
const router = express.Router();

const auth = require("../middleware/auth");
const upload = require("../middleware/upload");
const applyController = require("../controllers/applycontroller");

// photos 여러장 + job_file 1개
router.post(
  "/",
  auth,
  upload.fields([
    { name: "photos", maxCount: 10 },
    { name: "job_file", maxCount: 1 },
  ]),
  applyController.create
);

module.exports = router;
