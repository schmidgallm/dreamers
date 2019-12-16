const express = require('express');
const { check, validationResult } = require('express-validator');
const auth = require('../../middleware/auth');
const Story = require('../../models/Story');
const User = require('../../models/User');
const Profile = require('../../models/Profile');

const router = express.Router();

// @route   GET api/v1/story
// @desc    Get all stories
// @access  PUBLIC
router.get('/', async (req, res) => {
  try {
    const stories = await Story.find({}).sort({ publishedDate: -1 });
    res.json(stories);
  } catch (err) {
    console.error(err.message);
    res.status(500).send('Server Error');
  }
});

// @route   GET api/v1/story
// @desc    Get logged in users stories
// @access  PRIVATE
router.get('/mystories', auth, async (req, res) => {
  try {
    const profile = await Profile.findOne({
      user: req.user.id
    }).populate('stories', ['title', 'likes']);

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

// @route   GET api/v1/story/:id
// @desc    Get logged in users stories by id
// @access  PRIVATE
router.get('/:id', auth, async (req, res) => {
  try {
    const story = await Story.findById(req.params.id);

    // if no story with request id
    if (!story) {
      return res.status(404).json({ msg: 'Story not found' });
    }
    res.json(story);
  } catch (err) {
    console.error(err.message);
    if (err.kind === 'ObjectId') {
      return res.status(404).json({ msg: 'Story not found' });
    }
    res.status(500).send('Server Error');
  }
});

// @route   DELETE api/v1/story/:id
// @desc    Delete story
// @access  PRIVATE
router.delete('/:id', auth, async (req, res) => {
  try {
    const story = await Story.findById(req.params.id);

    // if story does not exist
    if (!story) {
      return res.status(404).json({ msg: 'Story not found' });
    }

    // check if story being deleted is created by user requesting deletion
    if (story.user.toString() !== req.user.id) {
      return res.status(401).json({ msg: 'User not authorized' });
    }

    // remove from db
    await story.remove();

    res.json({ msg: 'Story deleted' });
  } catch (err) {
    console.error(err.message);
    if (err.kind === 'ObjectId') {
      return res.status(404).json({ msg: 'Story not found' });
    }
    res.status(500).send('Server Error');
  }
});

// @route   POST api/v1/story
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
    // if errors from validation exists
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ errors: errors.array() });
    }
    try {
      const user = await User.findById(req.user.id).select('-password');
      const profile = await Profile.findOne({ user: req.user.id });

      // if no profile
      if (!profile) {
        return res.status(400).json({
          msg: 'Must first create a profile before submitting stories'
        });
      }

      // destructure request body
      const { name, penName, title, genre, content } = req.body;

      // init new instance of story
      const newStory = {};
      newStory.user = req.user.id;
      newStory.title = title;
      newStory.genre = genre;
      newStory.content = content;
      if (name) newStory.name = user.name;
      if (penName) newStory.penName = profile.penName;

      // save story to db and push story.id to profile
      const story = new Story(newStory);
      await story.save();
      await profile.update({ $push: { stories: story.id } });

      return res.status(200).json(story);
    } catch (err) {
      console.warn(err.message);
      res.status(500).send('Server Error');
    }
  }
);

module.exports = router;
