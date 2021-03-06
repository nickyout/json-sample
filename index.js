var path = require('path'),
	JSONSampleRegistry = require('./lib/registry/class'),
	JSONSamples = require('./lib/samples/class'),
	EventEmitter = require('eventemitter3');

var localRegistryPath = path.resolve(process.env.HOME, '.json-sample', 'registry.json');

var api = new EventEmitter();

api.registry = new JSONSampleRegistry(localRegistryPath);

api.samples = new JSONSamples('./json-sample.json', api.registry);

/**
 * Get the latest sample specs from all remote registries listed under 'remotes'
 * @param {Boolean} [force=false] - prefer remote sample specs over your own
 */
api.sync = require('./lib/sync');

/**
 * Add a new remote JSON file to the registry
 * @param {String} name - the name to use in the registry for this JSON
 * @param {String} url - url to JSON file
 * @param {String} [description] - description of the file
 * @param {Array.<String>} [tags=[]] - associated tags
 * @param {Boolean} [force=false] - add even if name or url already exists in registry. Be careful with this.
 */
api.add = require('./lib/add');

/**
 * Download all specified samples from the file json-samples.json in the current directory.
 */
api.install = require('./lib/install');

/**
 * Download and save a sample form the registry to a certain path
 * @param {String} name
 * @param {String} path
 * @param {Boolean} [doSave=false]
 */
api.installSave = require('./lib/install-save');

/**
 * Removes the associated file. If doSave is true, removes the reference from json-samples.json
 * @param {String} name
 * @param {Boolean} [doSave=false]
 */
api.removeSave = require('./lib/remove-save');

/**
 * Search for JSON samples in the registry
 * @param {JSONSampleQueryShorthanded} query
 * @returns {Promise.<Array>} - the results
 */
api.search = require('./lib/search');

/**
 * Create a new json-samples.json file in the current directory.
 * Does nothing if the file already exists.
 * @returns {Promise}
 */
api.init = require('./lib/init');

module.exports = api;
/**
 * The content of a registry.json file
 * @typedef {Object} JSONSampleRegistryData
 * @prop {Object.<String>} remotes - values are urls to other registry.json files
 * @prop {Object.<JSONSampleRegistryEntry>}
 */

/**
 * @typedef {Object} JSONSampleRegistryEntry
 * @prop {Number} date
 * @prop {String} url
 * @prop {Number} numBytes
 * @prop {Array.<String>} tags
 * @prop {JSONStats} stats
 */

/**
 * @typedef {JSONSampleQuery} JSONSampleQueryShorthanded
 * @prop {Number} [homogenity] - shorthand for object.homogenity
 * @prop {Boolean} [hasFloat] - shorthand for number.hasFloat
 * @prop {Boolean} [hasExponential] - shorthand for number.hasExponential
 * @prop {Boolean} [hasNegative] - shorthand for number.hasNegative
 * @prop {Boolean} [hasSpecialChars] - shorthand for string.hasSpecialChars AND key.hasSpecialChars
 */

/**
 * The dot is actually part of the key
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
