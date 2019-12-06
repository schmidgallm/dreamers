const dotenv = require("dotenv");
dotenv.config();
const express = require("express");
const router = express.Router();
const auth = require("../../middleware/auth");

const Profile = require("../../models/Profile");
const User = require("../../models/User");

// @route   GET api/v1/profile/me
// @desc    Get current users profile
// @access  PRIVATE
router.get("/me", auth, async (req, res) => {
  try {
    // fine profile from user and populate with name from users collection
    const profile = await Profile.findOne({
      user: req.user.id
    }).populate("users", ["name"]);

    // if not pofile of user exists
    if (!profile) {
      return res.status(400).json({ msg: "No profile...such sadness" });
    }

    // return profile
    return res.json(profile);
  } catch (err) {
    console.error(err.message);
    res.status(500).send("Server Error");
  }
});

module.exports = router;
