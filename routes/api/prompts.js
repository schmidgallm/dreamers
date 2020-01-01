const express = require('express');
const { check, validationResult } = require('express-validator');
const auth = require('../../middleware/auth');
const Prompt = require('../../models/Prompt');
const Profile = require('../../models/Profile');
const User = require('../../models/User');
const { promptLikeNotification } = require('../../scripts/mailgun');

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

// @route   PUT api/v1/promipt/like/:id
// @desc    Like a prompt
// @access  PRIVATE
router.put('/like/:id', auth, async (req, res) => {
  try {
    const prompt = await Prompt.findById(req.params.id);

    // check if prompt has already been liked
    if (
      prompt.likes.filter(like => like.user.toString() === req.user.id).length >
      0
    ) {
      return res.status(400).json({ msg: 'Prompt already liked' });
    }

    // unshift user to likes
    prompt.likes.unshift({ user: req.user.id });

    // update db
    await prompt.save();

    // send email notifcation of prompt liked when over 10 times
    const user = await User.findById(prompt.user);
    if (prompt.likes.length >= 10) {
      promptLikeNotification(user.getMaxListeners, prompt.title);
    }

    res.json(prompt.likes);
  } catch (err) {
    console.error(err.message);
    res.status(500).send('Server Error');
  }
});

// @route   PUT api/v1/prompt/unlike/:id
// @desc    Unlike a story
// @access  PRIVATE
router.put('/unlike/:id', auth, async (req, res) => {
  try {
    const prompt = await Prompt.findById(req.params.id);

    // check if story has already been liked
    if (
      prompt.likes.filter(like => like.user.toString() === req.user.id)
        .length === 0
    ) {
      return res.status(400).json({ msg: 'Prompt has not yet been liked' });
    }

    // get remove index
    const removeIndex = prompt.likes
      .map(like => like.user.toString())
      .indexOf(req.user.id);

    // slice out of likes array
    prompt.likes.splice(removeIndex, 1);

    // update db
    await prompt.save();

    res.json(prompt.likes);
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
      const { title, genre, content } = req.body;

      // init new instance of prompt
      const newPrompt = {};
      newPrompt.user = req.user.id;
      newPrompt.title = title;
      newPrompt.genre = genre;
      newPrompt.content = content;
      if (profile.penName) newPrompt.penName = profile.penName;
      if (!profile.penName) newPrompt.name = user.name;

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

// @route   POST api/v1/promipt/comment/:id
// @desc    CREATE a comment on a prompt
// @access  Private
router.post(
  '/comment/:id',
  [
    auth,
    check('text', 'Text is required')
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
      const prompt = await Prompt.findById(req.params.id);
      const profile = await Profile.findOne({ user: req.user.id });

      // if no profile
      if (!profile) {
        return res.status(400).json({
          msg: 'Must first create a profile before submitting stories'
        });
      }

      // destructure request body
      const { name, penName, text } = req.body;

      // init new instance of story
      const newComment = {};
      newComment.user = req.user.id;
      newComment.text = text;
      if (name) newComment.name = user.name;
      if (penName) newComment.penName = profile.penName;

      // unshift new comment and update db
      await prompt.comments.unshift(newComment);
      await prompt.save();

      return res.status(200).json(prompt.comments);
    } catch (err) {
      console.warn(err.message);
      res.status(500).send('Server Error');
    }
  }
);

// @route   DELETE api/v1/story/comment/:id/:comment_id
// @desc    Delete comment
// @access  Private
router.delete('/comment/:id/:comment_id', auth, async (req, res) => {
  try {
    const prompt = await Prompt.findById(req.params.id);

    // Get comment
    const comment = prompt.comments.find(
      com => com.id === req.params.comment_id
    );

    // Check if comment exists
    if (!comment) {
      return res.status(404).json({ msg: 'Comment does not exist' });
    }

    // Make sure comment requesting deletion is from comment user
    if (comment.user.toString() !== req.user.id) {
      return res.status(401).json({ msg: 'User not authorized' });
    }

    // get index of comment
    const removeIndex = prompt.comments
      .map(com => com.user.toString())
      .indexOf(req.user.id);

    // remove from comment array
    prompt.comments.splice(removeIndex, 1);

    // update db and return response
    await prompt.save();
    res.json(prompt.comments);
  } catch (err) {
    console.error(err.message);
    return res.status(500).send('Server Error');
  }
});

// @route   GET api/v1/prompt/trending
// @desc    Get prompts by most likes
// @access  Private
router.get('/trending/all', auth, async (req, res) => {
  try {
    // sort stories by greatest likes length and limit to 20
    const prompts = await Prompt.find({})
      .sort({ 'likes.length': -1 })
      .limit(20);

    // if not stories then they are not paid user
    if (!prompts) {
      return res.status(400).json({ msg: 'Upgrade now to see stories' });
    }

    return res.status(200).json(prompts);
  } catch (err) {
    console.error(err.message);
    return res.status(500).send('Server Error');
  }
});

module.exports = router;
