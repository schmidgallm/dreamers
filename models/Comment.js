// Dependencies
const mongoose = require('mongoose');

const CommentSchema = new mongoose.Schema({
  user: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'user',
  },
  penName: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'profile',
  },
  postId: {
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
    { type: mongoose.Schema.Types.ObjectId, ref: 'comment' },
  ],
  publishedDate: {
    type: Date,
    default: Date.now,
  },
});

const Comment = mongoose.model('comment', CommentSchema);

module.exports = Comment;
