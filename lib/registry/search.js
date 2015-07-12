var flatten = require('flat'),
	bytes = require('bytes'),
	dateJS = require("date.js"),
	isArray = require('../util/is-array');

/**
 * @typedef {JSONSampleQuery} JSONSampleQueryShorthanded
 * @prop {Number} [homogenity] - shorthand for object.homogenity
 * @prop {Boolean} [hasFloat] - shorthand for number.hasFloat
 * @prop {Boolean} [hasExponential] - shorthand for number.hasExponential
 * @prop {Boolean} [hasNegative] - shorthand for number.hasNegative
 * @prop {Boolean} [hasSpecialChars] - shorthand for string.hasSpecialChars AND key.hasSpecialChars
 */

/**
 * // The dot is actually part of the key
 * @typedef {Object} JSONSampleQuery
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
 *
 * @param {JSONSampleSearch} search
 */
function normalizeSearch(search) {
	var keys = Object.keys(search),
		key,
		i,
		value,
		isNegative;
	for (i = 0; i < keys.length; i++) {
		key = keys[i];
		value = search[key];
		switch (key) {
			case "numBytes":
				search[key] = bytes(value);
				break;
			case "date":
				if (value[0] === '-') {
					isNegative = true;
					value = value.substr(1);
				}
				search[key] = dateJS(value) * (isNegative ? -1 : 1);
				break;
			case "tags":
				search[key] = value.split(',');
				break;
			case "hasSpecialChars":
				delete search[key];
				search["stats.key." + key] = value;
				search["stats.string." + key] = value;
				break;
			case "hasExponential":
			case "hasNegative":
			case "hasFloat":
				delete search[key];
				search["stats.number." + key] = value;
				break;
			case "homogenity":
				delete search[key];
				search["stats.object." + key] = value;
				break;
			case "name":
				break;
			default:
				// if first name in search is not known to be an entry property, automatically add "stats."
				delete search[key];
				search["stats." + key] = value;
		}
	}
	return search;
}

function filter(search, keys, flatEntry) {
	var query,
		queryValue,
		value,
		i, j;
	for (i = 0; i < keys.length; i++) {
		query = keys[i];
		queryValue = search[query];
		if (flatEntry.hasOwnProperty(query)) {
			value = flatEntry[query];
			switch (typeof value) {
				case "number":
					if (queryValue < 0) {
						// must be leq
						if (-queryValue < value) {
							return false;
						}
					} else {
						// must be geq
						if (queryValue > value) {
							return false;
						}
					}
					break;
				case "boolean":
					if (queryValue !== value) {
						return false;
					}
					break;
				case "string":
					if (value.search(queryValue) === -1) {
						return false;
					}
					break;
				case "object":
					if (isArray(value) && isArray(queryValue)) {
						for (j = 0; j < queryValue.length; j++) {
							if (value.indexOf(queryValue[i]) === -1) {
								return false;
							}
						}
					}
					break;
			}
		}
	}
	return true;
}

/**
 *
 * @param {JSONSampleRegistryData} data
 * @param {JSONSampleQueryShorthanded} search
 * @returns {Array}
 */
module.exports = function(data, search) {
	search = normalizeSearch(search);
	var samples = data.samples,
		keys = Object.keys(samples),
		flatEntry,
		searchKeys = Object.keys(search),
		results = [],
		i,
		max;

	for (i = 0, max = keys.length; i < max; i++) {
		// flatten but preserve arrays
		flatEntry = flatten(samples[keys[i]], { safe: true });
		flatEntry.name = keys[i];
		if (filter(search, searchKeys, flatEntry)) {
			results.push(flatEntry);
		}
	}
	return results;
};