const express = require('express');
const { check, validationResult } = require('express-validator');
const auth = require('../../middleware/auth');
const Profile = require('../../models/Profile');
const User = require('../../models/User');

const router = express.Router();

// Controllers
const {
  getAllPosts,
  getAllPostsByThread,
  createPost,
  getPostById,
  getUserPosts,
  deletePost,
  addLike,
  removeLike,
  addComment,
  likeComment,
  unLikeComment,
} = require('../../controllers/community');

// @route   GET api/v1/community
// @desc    Get all profiles
// @access  PUBLIC
router.get('/', auth, async (req, res) => {
  getAllPosts(req, res);
});

// @route   GET api/v1/community/:id
// @desc    Get all posts by subThread
// @access  PUBLIC
router.get('/:subThread', auth, async (req, res) => {
  getAllPostsByThread(req, res);
});

// @route   GET api/v1/community/post/:id
// @desc    Get a post by id
// @access  PUBLIC
router.get('/post/:id', auth, async (req, res) => {
  getPostById(req, res);
});

// @route   GET api/v1/community/post/me
// @desc    Get posts by logged in user
// @access  Private
router.get('/post/me/myposts', auth, async (req, res) => {
  getUserPosts(req, res);
});

// @route   POST api/v1/community/:subThread
// @desc    Post a post to subThread
// @access  PUBLIC
router.post(
  '/:subThread',
  [
    auth,
    check('title', 'Title is required')
      .not()
      .isEmpty(),
    check('content', 'Content is required')
      .not()
      .isEmpty(),
  ],
  async (req, res) => {
    // if errors from validation exists
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ errors: errors.array() });
    }
    createPost(req, res);
  },
);

// @route   DELETE api/v1/community/:id
// @desc    Delete a post
// @access  PRIVATE
router.delete('/:id', auth, async (req, res) => {
  deletePost(req, res);
});

// @route   PUT api/v1/community/like/:id
// @desc    Like a post
// @access  PRIVATE
router.put('/like/:id', auth, async (req, res) => {
  addLike(req, res);
});

// @route   PUT api/v1/community/unlike/:id
// @desc    Unlike a post
// @access  PRIVATE
router.put('/unlike/:id', auth, async (req, res) => {
  removeLike(req, res);
});

// @route   POST api/v1/community/post/comment/:id
// @desc    CREATE a comment on a post
// @access  Public
router.post(
  '/post/comment/:id',
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
    addComment(req, res);
  },
);

// @route   PUT api/v1/community/comment/like/:id
// @desc    Like a comment
// @access  Public
router.put('/comment/like/:id', auth, async (req, res) => {
  likeComment(req, res);
});

// @route   PUT api/v1/community/comment/unlike/:id
// @desc    Like a comment
// @access  Public
router.put('/comment/unlike/:id', auth, async (req, res) => {
  unLikeComment(req, res);
});

module.exports = router;
