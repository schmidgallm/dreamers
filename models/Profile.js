// Dependencies
const mongoose = require('mongoose');

const ProfileSchema = new mongoose.Schema({
  user: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'user',
  },
  penName: {
    type: String,
    trim: true,
  },
  rating: {
    type: Number,
    default: 0,
  },
  bio: {
    type: String,
  },
  favoriteBook: {
    type: String,
  },
  favoriteAuthor: {
    type: String,
  },
  prompts: {
    type: [{ type: mongoose.Schema.Types.ObjectId, ref: 'prompt' }],
  },
  stories: {
    type: [{ type: mongoose.Schema.Types.ObjectId, ref: 'story' }],
  },
  spaces: {
    type: [{ type: mongoose.Schema.Types.ObjectId, ref: 'spaces' }],
  },
  posts: {
    type: [{ type: mongoose.Schema.Types.ObjectId, ref: 'post' }],
  },
});

const Profile = mongoose.model('profiles', ProfileSchema);

module.exports = Profile;
