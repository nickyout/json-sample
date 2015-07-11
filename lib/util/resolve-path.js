var path = require('path');
/**
 * Figure out what the destination file path should be based on the url and dest path.
 * @param {String} url
 * @param {String} dest - can be file or folder
 * @returns {String} the destination file path
 */
module.exports = function(url, dest) {
	var urlFileName = path.basename(url),
		destFileName = path.extname(dest) ? path.basename(dest) : '';
	if (!path.extname(urlFileName)) {
		urlFileName+='.json';
	}
	if (!destFileName) {
		dest = path.resolve(dest, urlFileName);
	}
	return dest;
};