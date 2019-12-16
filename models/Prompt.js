// Dependencies
const mongoose = require('mongoose');

const PromptSchema = new mongoose.Schema({
  user: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'user'
  },
  title: {
    type: String,
    required: true
  },
  genre: {
    type: String,
    required: true
  },
  likes: [
    {
      user: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'user'
      }
    }
  ],
  comments: [
    {
      user: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'user'
      },
      text: {
        type: String
      },
      date: {
        type: Date,
        default: Date.now
      }
    }
  ],
  publishedDate: {
    type: Date,
    default: Date.now
  },
  content: {
    type: String,
    required: true
  }
});

const Prompt = mongoose.model('prompt', PromptSchema);

module.exports = Prompt;
