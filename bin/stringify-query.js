var sprintf = require("tiny-sprintf"),
	bytes = require('bytes');

function abbrevNum(num) {
	if (num >= 100000000) {
		return ~~(num/100000000)/10 + 'G';
	}
	if (num >= 100000) {
		return ~~(num/100000)/10 + 'M';
	}
	if (num >= 1000) {
		return ~~(num/100)/10 + 'k';
	}
	return num;
}

/**
 * @prop {Number} [maxDepth] - maximum nesting of properties.
 * @prop {Number} [number.amount] - amount of number properties in the object
 * @prop {Boolean} [number.hasFloat] - whether or not some of the numbers are exponentials
 * @prop {Boolean} [number.hasExponential]
 * @prop {Boolean} [number.hasNegative]
 * @prop {Number} [string.amount]
 * @prop {Boolean} [string.hasSpecialChars]
 * @prop {Number} [string.maxSize] - length of the longest string
 * @prop {Number} [key.amount] - total number of object keys
 * @prop {Boolean} [key.hasSpecialChars] - whether at least one key has a special char
 * @prop {Number} [key.maxSize] - length of the longest object key
 * @prop {Number} [object.amount]
 * @prop {Number} [object.maxSize] - highest number of keys on an object
 * @prop {Number} [object.homogenity] - the number of times the most frequently occurring set of keys on an object occurs,
 * divided by the total number of objects. Rounded to 3 decimals.
 * @prop {Number} [array.amount] - total number of arrays
 * @prop {Number} [array.maxSize] - length of the longest array
 * @prop {Object} [null.amount] - total number of null occurrences
 * @prop {Object} [boolean.amount] - total number of boolean occurrences
 */

/**
 * @param {Array.<JSONSampleQuery>} result
 * @param {Boolean} [isVerbose=false]
 */
module.exports = function(result, isVerbose) {
	var response = [];
	if (!isVerbose) {
		var sprintfString = "%-20.20s %-30.30s %-10.10s %8.8s %7.7s %5s %5s %5s %5s %5s",
			el,
			i, str;
		response.push(sprintf(sprintfString,
			"name", "tags", "date", "bytes", "homogen", '#obj', "#arr", "#num", "#str", "#bool"
		));
		for (i = 0; i < result.length; i++) {
			str = sprintf(sprintfString);
			el = result[i];
			response.push(sprintf(sprintfString,
				el.name,
				el.tags.join(),
				new Date(el.date).toLocaleDateString(),
				bytes.format(el.numBytes),
				el['stats.object.homogenity'],
				abbrevNum(el['stats.object.amount']),
				abbrevNum(el['stats.array.amount']),
				abbrevNum(el['stats.number.amount']),
				abbrevNum(el['stats.string.amount']),
				abbrevNum(el['stats.boolean.amount'])
			));
		}
	} else {
		for (i = 0; i < result.length; i++) {
			response.push(result[i].name + ": " + JSON.stringify(result[i], null, 2));
		}
	}
	return response;
};