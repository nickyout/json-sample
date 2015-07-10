var got = require('got'),
	fse = require("fs-extra"),
	resolvePath = require('./lib/resolve-path'),
	regHasFloat = /\./,
	regHasExponential = /\e/i,
	regHasNegative = /-/,
	regJSONSpecialChars = /[\u0000-\u001F\\"/]/,
	toString = Object.prototype.toString,
	objKeys = Object.keys || function(obj) {
			var keys = [], name;
			for (name in obj) {
				if (obj.hasOwnProperty(name)) {
					keys.push(name);
				}
			}
			return keys;
		},
	isArray = Array.isArray || function(obj) {
			return toString.call(obj) === "[object Array]";
		};

/**
 *
 * @param {String} url
 * @param {String} dest - path to output file
 * @param {function(error, path)} callback
 */
function downloadJSON(url, dest, callback) {
	var urlStream = got(url),
		outputStream,
		destPath = resolvePath(url, dest);

	outputStream = urlStream.pipe(fse.createOutputStream(destPath));
	urlStream.on("error", callback);
	outputStream.on('error', callback);
	outputStream.on('finish', function() {
		interpretJSONFile(destPath, function(err, metaData) {
			if (err) {
				callback(err);
			}
			callback(null, {
				path: destPath,
				meta: metaData,
				url: url
			});
		})
	});
}

function interpretJSONFile(path, callback) {
	var numBytes,
		metaData;
	fse.lstat(path, function(err, result) {
		numBytes = result.size;
		if (err) {
			callback(err);
		}
		fse.readJSON(path, function(err, obj) {
			if (err) {
				callback(err);
			}
			metaData = interpretJSON(obj);
			metaData.numBytes = numBytes;
			callback(null, metaData);
		});
	});
}

/**
 * Come up with interesting json info
 * @param {String} obj
 * @returns {Object} meta data
 */
function interpretJSON(obj) {
	var metaData = {
			numBytes: 0,
			maxDepth: 0,
			number: {
				amount: 0,
				hasFloat: false,
				hasExponential: false,
				hasNegative: false
			},
			string: {
				hasSpecialChars: false,
				maxSize: 0,
				amount: 0
			},
			key: {
				hasSpecialChars: false,
				maxSize: 0,
				amount: 0
			},
			object: {
				maxSize: 0,
				amount: 0,
				homogenity: {

				}
			},
			array: {
				maxSize: 0,
				amount: 0
			},
			null: {
				amount: 0
			},
			boolean: {
				amount: 0
			}
		},
		homogenity,
		homoKeys,
		i,
		highest = 0,
		total = 0;
	interpretObject(metaData, obj, 0);
	homogenity = metaData.object.homogenity;
	homoKeys = objKeys(homogenity);
	for (i = 0; i < homoKeys.length; i++) {
		total += homogenity[homoKeys[i]];
		highest = Math.max(highest, homogenity[homoKeys[i]]);
	}
	// Prevent weird rounding (hopefully)
	metaData.object.homogenity = ~~(1000*highest/total)/1000;
	return metaData;
}

function interpretObject(meta, val, depth) {
	var metaType,
		keys,
		keysJoined,
		key,
		i;
	switch (typeof val) {
		case "object":
			if (val === null) {
				meta.null.amount++;
			} else if (isArray(val)) {
				meta.maxDepth = Math.max(meta.maxDepth, depth);
				metaType = meta.array;
				metaType.amount++;
				metaType.maxSize = Math.max(metaType.maxSize, val.length);
				for (i = 0; i < val.length; i++) {
					interpretObject(meta, val[i], depth+1);
				}
			} else {
				// Only Object is left right?
				meta.maxDepth = Math.max(meta.maxDepth, depth);
				keys = objKeys(val);
				metaType = meta.object;
				metaType.amount++;
				metaType.maxSize = Math.max(metaType.maxSize, keys.length);
				// Hopefully prevents most incorrect detections
				keysJoined = keys.join(':^)');
				if (!metaType.homogenity.hasOwnProperty(keysJoined)) {
					metaType.homogenity[keysJoined] = 1;
				} else {
					metaType.homogenity[keysJoined]++;
				}
				meta.key.amount+=keys.length;
				for (i = 0; i < keys.length; i++) {
					key = keys[i];
					meta.key.maxSize = Math.max(meta.key.maxSize, key.length);
					meta.key.hasSpecialChars || (meta.key.hasSpecialChars = regJSONSpecialChars.test(key));
					interpretObject(meta, val[key], depth+1);
				}
			}
			return;
		case "string":
			metaType = meta.string;
			metaType.amount++;
			metaType.hasSpecialChars || (metaType.hasSpecialChars = regJSONSpecialChars.test(val));
			metaType.maxSize = Math.max(metaType.maxSize, val.length);
			return;
		case "number":
			metaType = meta.number;
			metaType.amount++;
			metaType.hasExponential || (metaType.hasExponential = regHasExponential.test(val));
			metaType.hasFloat || (metaType.hasFloat = regHasFloat(val));
			metaType.hasNegative || (metaType.hasNegative = regHasNegative(val));
			return;
		case "boolean":
			meta.boolean.amount++;
			return;
	}
}

module.exports = downloadJSON;
