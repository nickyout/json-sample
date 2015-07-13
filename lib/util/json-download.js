var Promise = require('promise'),
	resolvePath = require('./resolve-path'),
	got = require('got'),
	fse = require('fs-extra'),
	ReadBufferLength = require('../stream/read-buffer-length'),
	toJSON = require('../stream/to-json');

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
			destPath,
			numBytes = 0,
			rfl;

		remote = got(url);
		remote.setEncoding('utf8');
		remote.on("error", reject);
		rfl = new ReadBufferLength();
		rfl.on('buffer-length', function(bufferLength) {
			numBytes = bufferLength;
		});

		if (dest) {
			destPath = resolvePath(dest, url);
			outputStream = remote.pipe(rfl).pipe(fse.createOutputStream(destPath));
			outputStream.on('finish', function() {
				// Surely, the output stream will finish after rfl is already finished... right?
				resolve({
					path: destPath,
					numBytes: numBytes
				});
			});
		} else {
			// return JSON object as result
			outputStream = remote.pipe(rfl).pipe(toJSON(function(err, obj) {
				if (err) {
					reject(err);
				} else {
					resolve({
						obj: obj,
						numBytes: numBytes
					})
				}
			}));
		}
		outputStream.on('error', reject);
	});
};