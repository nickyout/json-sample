var Promise = require('promise'),
	resolvePath = require('./resolve-path'),
	got = require('got');

/**
 * Download JSON to disk or memory
 * @param {String} url
 * @param {String} [dest] - if not specified, returns the JSON as object.
 * @returns {Promise.<String|*>} path to file, or object
 */
module.exports = function(url, dest) {
	return new Promise(function(resolve, reject) {
		var remote,
			outputStream,
			destPath;

		if (dest) {
			destPath = resolvePath(url, dest);
			remote = got(url);
			remote.on("error", reject);
			outputStream = remote.pipe(fse.createOutputStream(destPath));
			outputStream.on('error', reject);
			outputStream.on('finish', function() {
				resolve(destPath);
			});
		} else {
			// return JSON object as result
			destPath = resolvePath(url, dest);
			got(url, { json: true }, function(err, obj) {
				resolve(obj);
			});

		}

	});
};