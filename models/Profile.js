// Dependencies
const mongoose = require("mongoose");
const Schema = mongoose.Schema;

const ProfileSchema = new Schema({
  user: {
    type: mongoose.Schema.Types.ObjectId,
    ref: "users"
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
  }
});

module.exports = Profile = mongoose.model("profiles", ProfileSchema);
