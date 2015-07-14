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

function appendPrettyLog(response, result, properties) {
	var definitions,
		sprintfString,
		line,
		el,
		i;

	definitions = properties.map(function(name) {
		return display[name];
	}).filter(function(def) {
		// you typed that wrong
		return !!def;
	});
	sprintfString = definitions.map(function(def) {
		return def.sprintf;
	}).join(' ');

	line = definitions.map(function(def) {
		return def.header;
	});
	line.unshift(sprintfString);
	response.push(sprintf.apply(null, line));

	for (i = 0; i < result.length; i++) {
		el = result[i];
		line = definitions.map(function(def) {
			return def.getValue(el);
		});
		line.unshift(sprintfString);
		response.push(sprintf.apply(null, line));
	}

	return response;
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

var display = {
	'|': {
		header: "|",
		sprintf: "%s",
		getValue: function() {
			return "|"
		}
	},
	name: {
		header: "name",
		sprintf: "%-30.30s",
		getValue: function(el) {
			return el.name;
		}
	},
	description: {
		header: "description",
		sprintf: "%-50.50s",
		getValue: function(el) {
			return el.description;
		}
	},
	tags: {
		header: "tags",
		sprintf: "%-30.30s",
		getValue: function(el) {
			return el.tags.join();
		}
	},
	date: {
		header: 'date',
		sprintf: "%-11.11s",
		getValue: function(el) {
			return new Date(el.date).toLocaleDateString();
		}
	},
	bytes: {
		header: 'size',
		sprintf: '%-9.9s',
		getValue: function(el) {
			return bytes.format(el.numBytes);
		}
	},
	homogenity: {
		header: 'homogen',
		sprintf: '%7.7s',
		getValue: function(el) {
			return el['stats.object.homogenity'];
		}
	},
	depth: {
		header: 'depth',
		sprintf: '%5.5s',
		getValue: function(el) {
			return abbrevNum(el['stats.maxDepth']);
		}
	},
	objects: {
		header: '#obj',
		sprintf: '%5.5s',
		getValue: function(el) {
			return abbrevNum(el['stats.object.amount']);
		}
	},
	arrays: {
		header: '#arr',
		sprintf: '%5.5s',
		getValue: function(el) {
			return abbrevNum(el['stats.array.amount']);
		}
	},
	numbers: {
		header: '#num',
		sprintf: '%5.5s',
		getValue: function(el) {
			return abbrevNum(el['stats.number.amount']);
		}
	},
	strings: {
		header: '#str',
		sprintf: '%5.5s',
		getValue: function(el) {
			return abbrevNum(el['stats.string.amount'])
		}
	},
	booleans: {
		header: '#bool',
		sprintf: '%5.5s',
		getValue: function(el) {
			return abbrevNum(el['stats.boolean.amount']);
		}
	}
};

/**
 * @param {Array.<JSONSampleQuery>} result
 * @param {Boolean} [isVerbose=false]
 */
module.exports = function(result, isVerbose) {
	var response = [],
		el,
		i,
		str;

	if (!isVerbose) {
		// Possible values:
		// name, description, tags, url, bytes, date,
		// homogenity, depth, objects, arrays, numbers, strings, booleans
		appendPrettyLog(response, result, [
			'name', 'description', 'bytes', 'date',
			'|', 'homogenity', 'depth', 'objects', 'arrays', 'numbers', 'strings', 'booleans',
			'|', 'tags'
		]);
	} else {
		for (i = 0; i < result.length; i++) {
			response.push(result[i].name + ": " + JSON.stringify(result[i], null, 2));
		}
	}
	if (!result.length) {
		response.push('No matches found.');
	}
	return response;
};