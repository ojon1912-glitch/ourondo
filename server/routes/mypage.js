const express = require("express");
const router = express.Router();
const auth = require("../middleware/auth");
const applymodel = require("../models/applymodel");

router.get("/apply", auth, async (req, res) => {
  const userSeq = req.user.user_seq;
  const list = await applymodel.getMyApplies(userSeq);
  res.json(list);
});

module.exports = router;
