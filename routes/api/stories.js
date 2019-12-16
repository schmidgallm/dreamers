const express = require('express');
const { check, validationResult } = require('express-validator');
const auth = require('../../middleware/auth');
const Story = require('../../models/Story');
const Profile = require('../../models/Profile');

const router = express.Router();

// @route   POST api/v1/stories
// @desc    CREATE story
// @access  Public
router.get('/mystories', auth, async (req, res) => {
  try {
    const profile = await Profile.findOne({
      user: req.user.id
    }).populate('stories', ['title']);

    // if no profile of user exists
    if (!profile) {
      return res.status(400).json({ msg: 'No stories created yet.' });
    }

    console.log(profile);
    // return profile
    return res.json(profile);
  } catch (err) {
    console.error(err.message);
    res.status(500).send('Server Error');
  }
});

// @route   POST api/v1/stories
// @desc    CREATE story
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

      // CREATE story and save to db
      const story = new Story({
        user: req.user.id,
        title,
        genre,
        content
      });

      await story.save();

      // push new story to profile model
      const profile = await Profile.findOne({ user: req.user.id });
      if (profile) {
        await profile.update({ $push: { stories: story.id } });
      } else {
        return res.status(400).json({
          msg: 'Must first create a profile before submitting stories'
        });
      }

      return res.status(200).json(story);
    } catch (err) {
      console.warn(err.message);
      res.status(500).send('Server Error');
    }
  }
);

module.exports = router;
