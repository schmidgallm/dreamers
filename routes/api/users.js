const express = require('express');
const router = express.Router();

router.get('/', async (req, res) => {
	try {
		res.status(200).json({ msg: 'hello there' });
	} catch (err) {
		console.warn(err);
		res.status(401).json({ msg: 'Not authorized' });
	}
});

module.exports = router;
