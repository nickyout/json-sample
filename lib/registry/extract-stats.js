var regHasFloat = /\./,
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
 * Meant to give a good impression of what to expect of the json file it describes.
 * @typedef {Object} JSONStats
 * @prop {Number} maxDepth - maximum nesting of properties.
 * @prop {Object} number
 * @prop {Number} number.amount - amount of number properties in the object
 * @prop {Boolean} number.hasFloat - whether or not some of the numbers are exponentials
 * @prop {Boolean} number.hasExponential
 * @prop {Boolean} number.hasNegative
 * @prop {Object} string
 * @prop {Number} string.amount
 * @prop {Boolean} string.hasSpecialChars
 * @prop {Number} string.maxSize - length of the longest string
 * @prop {Object} key - data about object keys
 * @prop {Number} key.amount - total number of object keys
 * @prop {Boolean} key.hasSpecialChars - whether at least one key has a special char
 * @prop {Number} key.maxSize - length of the longest object key
 * @prop {Object} object
 * @prop {Number} object.amount
 * @prop {Number} object.maxSize - highest number of keys on an object
 * @prop {Number} object.homogenity - the number of times the most frequently occurring set of keys on an object occurs,
 * divided by the total number of objects. Rounded to 3 decimals.
 * @prop {Object} array
 * @prop {Number} array.amount - total number of arrays
 * @prop {Number} array.maxSize - length of the longest array
 * @prop {Object} null
 * @prop {Object} null.amount - total number of null occurrences
 * @prop {Object} boolean
 * @prop {Object} boolean.amount - total number of boolean occurrences
 */

/**
 * Come up with interesting json info
 * @param {*} val - already parsed json file
 * @returns {JSONStats} stats
 */
module.exports = function extractMetaData(val) {
	var stats = {
			maxDepth: 0,
			number: {
				amount: 0,
				hasFloat: false,
				hasExponential: false,
				hasNegative: false
			},
			string: {
				amount: 0,
				hasSpecialChars: false,
				maxSize: 0
			},
			key: {
				amount: 0,
				hasSpecialChars: false,
				maxSize: 0
			},
			object: {
				amount: 0,
				maxSize: 0,
				homogenity: { /* temporary object, becomes number */ }
			},
			array: {
				amount: 0,
				maxSize: 0
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
	interpret(stats, val, 0);
	homogenity = stats.object.homogenity;
	homoKeys = objKeys(homogenity);
	for (i = 0; i < homoKeys.length; i++) {
		total += homogenity[homoKeys[i]];
		highest = Math.max(highest, homogenity[homoKeys[i]]);
	}
	// Prevent weird rounding (hopefully)
	stats.object.homogenity = ~~(1000*highest/total)/1000;
	return stats;
};

function interpret(stats, val, depth) {
	var metaType,
		keys,
		keysJoined,
		key,
		i;
	switch (typeof val) {
		case "object":
			if (val === null) {
				stats.null.amount++;
			} else if (isArray(val)) {
				stats.maxDepth = Math.max(stats.maxDepth, depth+1);
				metaType = stats.array;
				metaType.amount++;
				metaType.maxSize = Math.max(metaType.maxSize, val.length);
				for (i = 0; i < val.length; i++) {
					interpret(stats, val[i], depth+1);
				}
			} else {
				// Only Object is left right?
				stats.maxDepth = Math.max(stats.maxDepth, depth+1);
				keys = objKeys(val);
				metaType = stats.object;
				metaType.amount++;
				metaType.maxSize = Math.max(metaType.maxSize, keys.length);
				// Hopefully prevents most incorrect detections
				keysJoined = keys.join(':^)');
				if (!metaType.homogenity.hasOwnProperty(keysJoined)) {
					metaType.homogenity[keysJoined] = 1;
				} else {
					metaType.homogenity[keysJoined]++;
				}
				stats.key.amount+=keys.length;
				for (i = 0; i < keys.length; i++) {
					key = keys[i];
					stats.key.maxSize = Math.max(stats.key.maxSize, key.length);
					stats.key.hasSpecialChars || (stats.key.hasSpecialChars = regJSONSpecialChars.test(key));
					interpret(stats, val[key], depth+1);
				}
			}
			return;
		case "string":
			metaType = stats.string;
			metaType.amount++;
			metaType.hasSpecialChars || (metaType.hasSpecialChars = regJSONSpecialChars.test(val));
			metaType.maxSize = Math.max(metaType.maxSize, val.length);
			return;
		case "number":
			metaType = stats.number;
			metaType.amount++;
			metaType.hasExponential || (metaType.hasExponential = regHasExponential.test(val));
			metaType.hasFloat || (metaType.hasFloat = regHasFloat.test(val));
			metaType.hasNegative || (metaType.hasNegative = regHasNegative.test(val));
			return;
		case "boolean":
			stats.boolean.amount++;
			return;
	}
}
