var fse = require("fs-extra"),
	extractStats = require('./extract-stats'),
	Promise = require('promise'),
	readJSON = Promise.denodeify(fse.readJSON),
	lstat = Promise.denodeify(fse.lstat);

function getNumBytes(path) {
	return lstat(path)
		.then(function(stat) {
			return stat.size;
		});
}

/**
 *
 * @param {String} filePath
 * @param {String} url
 * @param {Array.<String>} tags
 * @returns {Promise.<JSONSampleListEntry>}
 */
module.exports = function(filePath, url, tags) {
	return Promise
		.all([getNumBytes(filePath), readJSON(filePath)])
		.then(function (results) {
			return {
				url: url,
				date: +new Date(),
				tags: tags || [],
				numBytes: results[0],
				stats: extractStats(results[1])
			}
		});
};