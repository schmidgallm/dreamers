// Dependencies
const express = require('express');
const { check, validationResult } = require('express-validator');
const multer = require('multer');
const dotenv = require('dotenv');
const auth = require('../../middleware/auth');
const { storyLikeNotification } = require('../../scripts/mailgun');
const uploadFileToS3 = require('../../upload/index');
const Story = require('../../models/Story');
const User = require('../../models/User');
const Profile = require('../../models/Profile');

// Init enviormental variables
dotenv.config();

// init multer storage engine
const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    cb(null, 'upload/files/');
  },
  filename: (req, file, cb) => {
    cb(null, file.originalname);
  },
});

const upload = multer({ storage });

// Init Express router
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

// @route   GET api/v1/story/mystories
// @desc    Get logged in users stories
// @access  PRIVATE
router.get('/mystories', auth, async (req, res) => {
  try {
    const profile = await Profile.findOne({
      user: req.user.id,
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

// @route   PUT api/v1/story/like/:id
// @desc    Like a story
// @access  PRIVATE
router.put('/like/:id', auth, async (req, res) => {
  try {
    const story = await Story.findById(req.params.id);

    // check if story has already been liked by user
    if (
      story.likes.filter(like => like.user.toString() === req.user.id)
        .length > 0
    ) {
      return res.status(400).json({ msg: 'Story already liked' });
    }

    // unshift user to likes
    story.likes.unshift({ user: req.user.id });

    // update db
    await story.save();

    // Send email notification of story liked when over 10 times
    const user = await User.findById(story.user);
    if (story.likes.length >= 10) {
      storyLikeNotification(user.email, story.title);
    }

    res.json(story.likes);
  } catch (err) {
    console.error(err.message);
    res.status(500).send('Server Error');
  }
});

// @route   PUT api/v1/stories/unlike/:id
// @desc    Unlike a story
// @access  PRIVATE
router.put('/unlike/:id', auth, async (req, res) => {
  try {
    const story = await Story.findById(req.params.id);

    // check if story has already been liked
    if (
      story.likes.filter(like => like.user.toString() === req.user.id)
        .length === 0
    ) {
      return res
        .status(400)
        .json({ msg: 'Story has not yet been liked' });
    }

    // get remove index
    const removeIndex = story.likes
      .map(like => like.user.toString())
      .indexOf(req.user.id);

    // slice out of likes array
    story.likes.splice(removeIndex, 1);

    // update db
    await story.save();

    res.json(story.likes);
  } catch (err) {
    console.error(err.message);
    res.status(500).send('Server Error');
  }
});

// @route   POST api/v1/stories
// @desc    CREATE story and save doc to S3 Bucket
// @access  Public
router.post('/', auth, upload.single('story'), async (req, res) => {
  uploadFileToS3(req, res);
});

// @route   POST api/v1/stories/comment/:id
// @desc    CREATE a comment on story
// @access  Private
router.post(
  '/comment/:id',
  [
    auth,
    check('text', 'Text is required')
      .not()
      .isEmpty(),
  ],
  async (req, res) => {
    // if errors from validation exists
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ errors: errors.array() });
    }
    try {
      const user = await User.findById(req.user.id).select(
        '-password',
      );
      const story = await Story.findById(req.params.id);
      const profile = await Profile.findOne({ user: req.user.id });

      // if no profile
      if (!profile) {
        return res.status(400).json({
          msg:
            'Must first create a profile before submitting stories',
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
      await story.comments.unshift(newComment);
      await story.save();

      return res.status(200).json(story.comments);
    } catch (err) {
      console.warn(err.message);
      res.status(500).send('Server Error');
    }
  },
);

// @route   DELETE api/v1/story/comment/:id/:comment_id
// @desc    Delete comment
// @access  Private
router.delete('/comment/:id/:comment_id', auth, async (req, res) => {
  try {
    const story = await Story.findById(req.params.id);

    // Get comment
    const comment = story.comments.find(
      com => com.id === req.params.comment_id,
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
    const removeIndex = story.comments
      .map(com => com.user.toString())
      .indexOf(req.user.id);

    // remove from comment array
    story.comments.splice(removeIndex, 1);

    // update db and return response
    await story.save();
    res.json(story.comments);
  } catch (err) {
    console.error(err.message);
    return res.status(500).send('Server Error');
  }
});

// @route   GET api/v1/story/trending
// @desc    Get stories by most likes
// @access  Private
router.get('/trending/all', auth, async (req, res) => {
  try {
    // sort stories by greatest likes length and limit to 20
    const stories = await Story.find({})
      .sort({ 'likes.length': -1 })
      .limit(20);

    // if not stories then they are not paid user
    if (!stories) {
      return res
        .status(400)
        .json({ msg: 'Upgrade now to see stories' });
    }

    return res.status(200).json(stories);
  } catch (err) {
    console.error(err.message);
    return res.status(500).send('Server Error');
  }
});

module.exports = router;
