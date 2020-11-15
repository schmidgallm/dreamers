// Dependencies
const mongoose = require('mongoose');

const PostSchema = new mongoose.Schema({
  user: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'user',
  },
  penName: {
    type: String,
    required: true,
  },
  title: {
    type: String,
    required: true,
  },
  subThread: {
    type: String,
    required: true,
  },
  content: {
    type: String,
    required: true,
  },
  likes: [
    {
      user: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'user',
      },
    },
  ],
  comments: [
    {
      user: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'user',
      },
    },
  ],
  publishedDate: {
    type: Date,
    default: Date.now,
  },
});

const Post = mongoose.model('post', PostSchema);

module.exports = Post;
