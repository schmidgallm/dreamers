const express = require('express');
const { check, validationResult } = require('express-validator');
const auth = require('../../middleware/auth');
const Story = require('../../models/Story');
const Profile = require('../../models/Profile');

const router = express.Router();

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

      // init new instance of story object
      const storyFields = {};
      storyFields.user = req.user.id;
      if (title) storyFields.title = title;
      if (genre) storyFields.genre = genre;
      if (content) storyFields.content = content;

      // CREATE story and save to db
      const story = new Story(storyFields);
      await story.save();

      // push new story to profile model
      const profile = await Profile.findOne({ user: req.user.id });
      if (profile) {
        console.log(story.id);
        await profile.updateOne(
          { user: req.user.id },
          { $set: { stories: story.id } }
        );
      }

      return res.status(200).json(story);
    } catch (err) {
      console.warn(err.message);
      res.status(500).send('Server Error');
    }
  }
);

module.exports = router;
