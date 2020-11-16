// Import Models
const Post = require('../models/Post');
const Profile = require('../models/Profile');
const User = require('../models/User');
const Comment = require('../models/Comment');

// Get all posts and sort by published date newest to oldest
exports.getAllPosts = async (req, res) => {
  try {
    // find all posts and sort by pubslished date newest to oldest
    const posts = await Post.find({}).sort({ publishedDate: -1 });

    // If no posts
    if (!posts) {
      return res.status(400).json({ msg: 'No posts found' });
    }

    return res.status(200).json(posts);
  } catch (err) {
    console.error(err.message);
    return res.status(500).send('Server Error');
  }
};

// Get all posts by sub thread and date newest to oldest
exports.getAllPostsByThread = async (req, res) => {
  try {
    console.log(req.params.subThread);
    // find all posts and sort by pubslished date newest to oldest
    const posts = await Post.find({
      subThread: req.params.subThread,
    }).sort({ publishedDate: -1 });

    // If no posts
    if (!posts || posts.length === 0) {
      return res.status(400).json({ msg: 'No posts found' });
    }

    return res.status(200).json(posts);
  } catch (err) {
    console.error(err.message);
    res.status(500).send('Server Error');
  }
};

// Get post by id
exports.getPostById = async (req, res) => {
  try {
    const post = await Post.findById(req.params.id);

    if (!post) {
      return res.status(400).json({ msg: 'No post found' });
    }

    return res.status(200).json(post);
  } catch (err) {
    console.error(err.message);
    res.status(500).send('Server Error');
  }
};

// Get logged in user post
exports.getUserPosts = async (req, res) => {
  const post = await Post.find({ user: req.user.id });

  if (!post) {
    return res.status(400).json({ msg: 'No posts created yet' });
  }

  return res.status(200).json(post);
};

// create a post to subthread
exports.createPost = async (req, res) => {
  try {
    const profile = await Profile.findOne({ user: req.user.id });

    if (!profile) {
      return res.status(400).json({
        msg: 'Must first create a profile before submitting stories',
      });
    }

    const newPost = {};
    newPost.user = req.user.id;
    newPost.penName = profile.penName;
    newPost.title = req.body.title;
    newPost.subThread = req.params.threadId;
    newPost.content = req.body.content;

    // save post to db and push post.id to profile
    const post = new Post(newPost);
    await post.save();
    await profile.update({ $push: { posts: post.id } });

    return res.status(200).json(newPost);
  } catch (err) {
    console.error(err.message);
    res.status(500).send('Server Error');
  }
};

// Delete a post
exports.deletePost = async (req, res) => {
  try {
    const post = await Post.findById(req.params.id);

    // Check if post exists
    if (!post) {
      return res.status(404).json({ msg: 'Post not found' });
    }

    // check if user is creator of post to be deleted
    if (post.user.toString() !== req.user.id) {
      return res.status(401).json({ msg: 'User not authorized' });
    }

    // remove from db
    await post.remove();

    return res.status(200).json({ msg: 'Post successfully deleted' });
  } catch (err) {
    console.error(err.message);
    res.status(500).send('Server Error');
  }
};

exports.addLike = async (req, res) => {
  try {
    const post = await Post.findById(req.params.id);

    // check if prompt has already been liked
    if (
      post.likes.filter(like => like.user.toString() === req.user.id)
        .length > 0
    ) {
      return res.status(400).json({ msg: 'Post already liked' });
    }

    // unshift user to likes
    post.likes.unshift({ user: req.user.id });

    // update db
    await post.save();

    return res.json(post.likes);
  } catch (err) {
    console.error(err.message);
    return res.status(500).send('Server Error');
  }
};

exports.removeLike = async (req, res) => {
  try {
    const post = await Post.findById(req.params.id);

    // check if story has already been liked
    if (
      post.likes.filter(like => like.user.toString() === req.user.id)
        .length === 0
    ) {
      return res
        .status(400)
        .json({ msg: 'Post has not yet been liked' });
    }

    // get remove index
    const removeIndex = post.likes
      .map(like => like.user.toString())
      .indexOf(req.user.id);

    // slice out of likes array
    post.likes.splice(removeIndex, 1);

    // update db
    await post.save();

    return res.status(200).json(post.likes);
  } catch (err) {
    console.error(err.message);
    res.status(500).send('Server Error');
  }
};

exports.addComment = async (req, res) => {
  try {
    const post = await Post.findById(req.params.id);
    const profile = await Profile.findOne({ user: req.user.id });

    // if no profile
    if (!profile) {
      return res.status(400).json({
        msg: 'Must first create a profile before submitting stories',
      });
    }

    // init new instance of story
    const newComment = {};
    newComment.user = req.user.id;
    newComment.penName = profile.penName;
    newComment.postId = req.params.id;
    newComment.content = req.body.content;

    // Save comment to DB
    const comment = new Comment(newComment);
    await comment.save();

    // Add comments to post model
    await post.comments.unshift(comment.id);
    await post.save();

    return res.status(200).json(comment);
  } catch (err) {
    console.warn(err.message);
    res.status(500).send('Server Error');
  }
};

exports.likeComment = async (req, res) => {
  try {
    const comment = await Comment.findById(req.params.id);

    // check if prompt has already been liked
    if (
      comment.likes.filter(
        like => like.user.toString() === req.user.id,
      ).length > 0
    ) {
      return res.status(400).json({ msg: 'Comment already liked' });
    }

    // unshift user to likes
    comment.likes.unshift({ user: req.user.id });

    // update db
    await comment.save();

    return res.json(comment.likes);
  } catch (err) {
    console.error(err.message);
    return res.status(500).send('Server Error');
  }
};

exports.unLikeComment = async (req, res) => {
  try {
    const comment = await Comment.findById(req.params.id);

    // check if story has already been liked
    if (
      comment.likes.filter(
        like => like.user.toString() === req.user.id,
      ).length === 0
    ) {
      return res
        .status(400)
        .json({ msg: 'Comment has not yet been liked' });
    }

    // get remove index
    const removeIndex = comment.likes
      .map(like => like.user.toString())
      .indexOf(req.user.id);

    // slice out of likes array
    comment.likes.splice(removeIndex, 1);

    // update db
    await comment.save();

    return res.json(comment.likes);
  } catch (err) {
    console.error(err.message);
    res.status(500).send('Server Error');
  }
};

exports.createSubComment = async (req, res) => {
  try {
    const parentComment = await Comment.findById(req.params.id);
    const profile = await Profile.findOne({ user: req.user.id });

    // if no profile
    if (!profile) {
      return res.status(400).json({
        msg: 'Must first create a profile before submitting stories',
      });
    }

    // init new instance of story
    const newComment = {};
    newComment.user = req.user.id;
    newComment.penName = profile.penName;
    newComment.postId = req.params.id;
    newComment.content = req.body.content;

    // Save comment to DB
    const comment = new Comment(newComment);
    await comment.save();

    // Add sub comment to db
    await parentComment.comments.unshift(comment.id);
    await parentComment.save();

    return res.status(200).json(comment);
  } catch (err) {
    console.warn(err.message);
    res.status(500).send('Server Error');
  }
};
