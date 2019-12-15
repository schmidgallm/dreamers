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
  upvotes: {
    type: Number,
    default: 0
  },
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
