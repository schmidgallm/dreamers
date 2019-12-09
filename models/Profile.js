// Dependencies
const mongoose = require('mongoose');

const { Schema } = mongoose;

const ProfileSchema = new Schema({
  user: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'users'
  },
  penName: {
    type: String,
    trim: true
  },
  rating: {
    type: Number,
    default: 0
  },
  bio: {
    type: String
  },
  favoriteBook: {
    type: String
  },
  favoriteAuthor: {
    type: String
  },
  prmopts: {
    type: [{ type: mongoose.Schema.Types.ObjectId, ref: 'prompts' }]
  },
  stories: {
    type: { type: mongoose.Schema.Types.ObjectId, ref: 'stories' }
  }
});

const Profile = mongoose.model('profiles', ProfileSchema);

module.exports = Profile;
