const express = require('express');
const { check, validationResult } = require('express-validator');
const auth = require('../../middleware/auth');
const Prompt = require('../../models/Prompt');
const Profile = require('../../models/Profile');
const User = require('../../models/User');

const router = express.Router();

// @route   GET api/v1/prompt
// @desc    Get all stories
// @access  PUBLIC
router.get('/', async (req, res) => {
  try {
    const prompts = await Prompt.find({}).sort({ publishedDate: -1 });
    res.json(prompts);
  } catch (err) {
    console.error(err.message);
    res.status(500).send('Server Error');
  }
});

// @route   GET api/v1/prompt/myprompts
// @desc    GET logged in users prompts
// @access  Public
router.get('/myprompts', auth, async (req, res) => {
  try {
    const profile = await Profile.findOne({
      user: req.user.id
    }).populate('prompts', ['title', 'likes']);

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

// @route   GET api/v1/prompt/:id
// @desc    Get logged in users prompts by id
// @access  PRIVATE
router.get('/:id', auth, async (req, res) => {
  try {
    const prompt = await Prompt.findById(req.params.id);

    // if no story with request id
    if (!prompt) {
      return res.status(404).json({ msg: 'Story not found' });
    }
    res.json(prompt);
  } catch (err) {
    console.error(err.message);
    if (err.kind === 'ObjectId') {
      return res.status(404).json({ msg: 'Story not found' });
    }
    res.status(500).send('Server Error');
  }
});

// @route   DELETE api/v1/prompt/:id
// @desc    Delete prompt
// @access  PRIVATE
router.delete('/:id', auth, async (req, res) => {
  try {
    const prompt = await Prompt.findById(req.params.id);

    // if story does not exist
    if (!prompt) {
      return res.status(404).json({ msg: 'Prompt not found' });
    }

    // check if story being deleted is created by user requesting deletion
    if (prompt.user.toString() !== req.user.id) {
      return res.status(401).json({ msg: 'User not authorized' });
    }

    // remove from db
    await prompt.remove();

    res.json({ msg: 'Prompt deleted' });
  } catch (err) {
    console.error(err.message);
    if (err.kind === 'ObjectId') {
      return res.status(404).json({ msg: 'Prompt not found' });
    }
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

      // init new instance of prompt
      const newPrompt = {};
      newPrompt.user = req.user.id;
      newPrompt.title = title;
      newPrompt.genre = genre;
      newPrompt.content = content;
      if (name) newPrompt.name = user.name;
      if (penName) newPrompt.penName = profile.penName;

      // save prompt to db and push prompt.id to profile
      const prompt = new Prompt(newPrompt);
      await prompt.save();
      await profile.update({ $push: { prompts: prompt.id } });

      return res.status(200).json(prompt);
    } catch (err) {
      console.warn(err.message);
      res.status(500).send('Server Error');
    }
  }
);

module.exports = router;
