var flatten = require('flat'),
	bytes = require('bytes'),
	dateJS = require("date.js"),
	isArray = require('../util/is-array');

/**
 *
 * @param {JSONSampleQuery} search
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
				if (key.search('stats') === -1) {
					// if first name in search is not known to be an entry property, automatically add "stats."
					delete search[key];
					search["stats." + key] = value;
				}
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
					queryValue = +queryValue;
					value = +value;
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
					if (value.search(new RegExp(queryValue, 'i')) === -1) {
						return false;
					}
					break;
				case "object":
					if (isArray(value) && isArray(queryValue)) {
						for (j = 0; j < queryValue.length; j++) {
							if (value.indexOf(queryValue[j]) === -1) {
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
		match = search.match && new RegExp(search.match),
		results = [],
		i,
		max;

	for (i = 0, max = keys.length; i < max; i++) {
		// flatten but preserve arrays
		flatEntry = flatten(samples[keys[i]], { safe: true });
		flatEntry.name = keys[i];
		if ((!match || match.test(flatEntry.name) || match.test(flatEntry.description) || match.test(flatEntry.tags.join()))
			&& filter(search, searchKeys, flatEntry)) {
			results.push(flatEntry);
		}
	}
	return results;
};