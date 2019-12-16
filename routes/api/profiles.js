const express = require('express');
const auth = require('../../middleware/auth');
const Profile = require('../../models/Profile');
const User = require('../../models/User');

const router = express.Router();

// @route   GET api/v1/profiles
// @desc    Get all profiles
// @access  PUBLIC
router.get('/', async (req, res) => {
  try {
    const profiles = await Profile.find({}).populate('user', 'name');
    res.json(profiles);
  } catch (err) {
    console.error(err.message);
    res.status(500).send('Server Error');
  }
});

// @route   GET api/v1/profiles/users/:user_id
// @desc    Get profile by user ID
// @access  PUBLIC
router.get('/users/:user_id', async (req, res) => {
  try {
    const profile = await Profile.find({ user: req.params.user_id })
      .populate('user', 'name')
      .populate('stories', ['title', 'likes', 'comments', 'publishedDate'])
      .populate('prompts', ['title', 'likes', 'comments', 'publishedDate']);

    // if no profile
    if (!profile) {
      return res.status(400).json({ msg: 'No profile yet...such sadness' });
    }

    // return profile
    res.json(profile);
  } catch (err) {
    console.error(err.message);

    // Avoid server error message from valid objectIds in request param
    if (err.kind === 'ObjectId') {
      return res.status(400).json({ msg: 'No profile yet...such sadness' });
    }
    res.status(500).send('Server Error');
  }
});

// @route   GET api/v1/profiles/me
// @desc    Get logged in users profile
// @access  PRIVATE
router.get('/me', auth, async (req, res) => {
  try {
    // fine profile from user and populate with name from users collection
    const profile = await Profile.findOne({
      user: req.user.id
    })
      .populate('user', 'name')
      .populate('stories', ['title', 'likes', 'comments', 'publishedDate'])
      .populate('prompts', ['title', 'likes', 'comments', 'publishedDate']);

    // if not pofile of user exists
    if (!profile) {
      return res.status(400).json({ msg: 'No profile...such sadness' });
    }

    // return profile
    res.json(profile);
  } catch (err) {
    console.error(err.message);
    res.status(500).send('Server Error');
  }
});

// @route   POST api/v1/profile/me
// @desc    Create or update user profile
// @access  PRIVATE
router.post('/', auth, async (req, res) => {
  // destructure request body
  const {
    penName,
    rating,
    bio,
    favoriteBook,
    favoriteAuthor,
    stories,
    prompts
  } = req.body;

  // init profile object
  const profileFields = {};
  profileFields.user = req.user.id;

  if (penName) profileFields.penName = penName;
  if (rating) profileFields.rating = rating;
  if (bio) profileFields.bio = bio;
  if (favoriteBook) profileFields.favoriteBook = favoriteBook;
  if (favoriteAuthor) profileFields.favoriteAuthor = favoriteAuthor;
  if (stories) profileFields.stories = stories;
  if (prompts) profileFields.prompts = prompts;

  try {
    let profile = await Profile.findOne({ user: req.user.id });

    // UPDATE profile
    if (profile) {
      profile = await Profile.findOneAndUpdate(
        { user: req.user.id },
        { $set: profileFields },
        { new: true }
      );

      return res.json(profile);
    }

    // CREATE profile
    profile = new Profile(profileFields);

    // save to db
    await profile.save();
    return res.status(200).json(profile);
  } catch (err) {
    console.error(err.message);
    res.status(500).send('Server Error');
  }
});

// @route   DELETE api/v1/profiles
// @desc    Delete prifle, user, stories, and prompts
// @access  PRIVATE
router.delete('/', auth, async (req, res) => {
  try {
    // TODO - remove users stories and prompts
    //  remove profile
    await Profile.findOneAndRemove({ user: req.user.id });

    // remove user
    await User.findOneAndRemove({ _id: req.user.id });

    res.json({ msg: 'User deleted' });
  } catch (err) {
    console.error(err.message);
    res.status(500).send('Server Error');
  }
});

module.exports = router;
