// Dependencies
const mongoose = require('mongoose');

const { Schema } = mongoose;

const StorySchema = new Schema({
  user: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'users'
  },
  title: {
    type: String,
    required: true
  },
  genre: {
    type: String,
    required: true
  },
  content: {
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
  }
});

const Story = mongoose.model('stories', StorySchema);

module.exports = Story;
