const express = require('express');
const { check, validationResult } = require('express-validator');
const auth = require('../../middleware/auth');
const Prompt = require('../../models/Prompt');
const Profile = require('../../models/Profile');

const router = express.Router();

// @route   GET api/v1/myprompts
// @desc    GET logged in users prompts
// @access  Public
router.get('/myprompts', auth, async (req, res) => {
  try {
    const profile = await Profile.findOne({
      user: req.user.id
    }).populate('prompts', ['title', 'genre', 'upvotes', 'publishedDate']);

    // if no profile of user exists
    if (!profile) {
      return res.status(400).json({ msg: 'No prompts created yet.' });
    }

    // return profile
    return res.json(profile);
  } catch (err) {
    console.error(err.message);
    res.status(500).send('Server Error');
  }
});
// @route   POST api/v1/prompt
// @desc    CREATE prompt
// @access  Public
router.post(
  '/',
  [
    auth,
    check('title', 'Title is required')
      .not()
      .isEmpty(),
    check('genre', 'Genre is required')
      .not()
      .isEmpty(),
    check('content', 'Content is required')
      .not()
      .isEmpty()
  ],
  async (req, res) => {
    try {
      // if errors from validation exists
      const errors = validationResult(req);
      if (!errors.isEmpty()) {
        return res.status(400).json({ errors: errors.array() });
      }
      // destructure request body
      const { title, genre, content } = req.body;

      // CREATE prompt and save to db
      const prompt = new Prompt({
        user: req.user.id,
        title,
        genre,
        content
      });

      await prompt.save();

      // push new story to profile model
      const profile = await Profile.findOne({ user: req.user.id });
      if (profile) {
        await profile.update({ $push: { prompts: prompt.id } });
      } else {
        return res.status(400).json({
          msg: 'Must first create a profile before submitting prompts'
        });
      }

      return res.status(200).json(prompt);
    } catch (err) {
      console.warn(err.message);
      res.status(500).send('Server Error');
    }
  }
);

module.exports = router;
