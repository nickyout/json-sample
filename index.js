var got = require('got'),
	fse = require("fs-extra");
	resolvePath = require('./lib/resolve-path');

/**
 *
 * @param {String} url
 * @param {String} [dest] - path to output file. If omitted, stdout is used.
 * @returns {ReadableStream}
 */
function downloadJSON(url, dest, callback) {
	var urlStream = got(url),
		outputStream,
		destPath;
	if (dest) {
		destPath = resolvePath(url, dest);
		outputStream = urlStream.pipe(fse.createOutputStream(destPath));
		outputStream.on('finish', function() {
			console.error("Saved to " + destPath);
		});
	} else {
		outputStream = urlStream.pipe(process.stdout);
	}
	urlStream.on("error", function(error) {
		console.error("Transfer failed:", error.message);
	});
	outputStream.on('error', function(error) {
		console.error("Saving failed:", error.message);
	});
	return outputStream;
}

module.exports = downloadJSON;
