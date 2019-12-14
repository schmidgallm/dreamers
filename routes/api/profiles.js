const express = require('express');
const auth = require('../../middleware/auth');
const Profile = require('../../models/Profile');
const User = require('../../models/User');

const router = express.Router();

// @route   GET api/v1/profile/me
// @desc    Get current users profile
// @access  PRIVATE
router.get('/me', auth, async (req, res) => {
  try {
    // fine profile from user and populate with name from users collection
    const profile = await Profile.findOne({
      user: req.user.id
    }).populate('stories', ['title', 'genre', 'upvotes', 'publishedDate']);

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

module.exports = router;
