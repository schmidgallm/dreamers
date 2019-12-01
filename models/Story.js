// Dependencies
const mongoose = require('mongoose');
const Schema = mongoose.Schema;

const StorySchema = new Schema({
	title: {
		type: String,
		required: true
	},
	content: {
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
	}
});

module.exports = Story = mongoose.model('stories', StorySchema);
