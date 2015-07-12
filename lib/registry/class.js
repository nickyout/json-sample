var fse = require('fs-extra'),
	Promise = require("promise"),
	read = Promise.denodeify(fse.readJSON),
	write = Promise.denodeify(fse.writeJSON),
	jsonDownload = require("../util/json-download"),
	url = require("url");

//var log = console.log.bind(console, "json-sample:");

function isURLEqual(url1, url2) {
	var parsed1 = url.parse(url1, false, true),
		parsed2 = url.parse(url2, false, true);
	return (parsed1.hostname == parsed2.hostname && parsed1.path == parsed2.path);
}

function merge(myData, theirData, force) {
	var mySamples = myData.samples,
		theirSamples = theirData.samples,
		mergeStats = {
			added: 0,
			updated: 0,
			omitted: 0
		},
		name;

	for (name in theirSamples) {
		if (!force) {
			if (mySamples.hasOwnProperty(name)) {
				mergeStats.omitted++;
				continue;
			}
		}
		if (mySamples.hasOwnProperty(name)) {
			mergeStats.updated++;
		} else {
			mergeStats.added++;
		}
		mySamples[name] = theirSamples[name];
	}
	return mergeStats;
}

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
 * Represent a registry.
 * @param {String} path - path to registry.json
 * @constructor
 */
function JSONSampleRegistry(path) {
	this.path = path;
	this.isRemote = !!url.parse(this.path, false, true).hostname;
	this.isReadOnly = this.isRemote;
	this.data = null;
	// bind ALL the things!
	for (var name in this) {
		if (typeof this[name] === "function") {
			this[name] = this[name].bind(this);
		}
	}
}

/**
 * Reads the source into memory.
 * @param force
 * @return {Promise.<*>} resolves to the json object
 */
JSONSampleRegistry.prototype.read = function(force) {
	var self = this,
		path = this.path;
	if (this.data && !force) {
		return Promise.resolve(this.data);
	} else {
		if (this.isRemote) {
			// assume url
			return jsonDownload(this.path)
				.then(function(obj) {
					self.data = obj;
					return self.data;
				});
		} else {
			// assume local file
			return new Promise(
				function(resolve, reject) {
					if (fse.existsSync(path)) {
						resolve(read(path));
					} else {
						// Just make a copy then.
						//log("no local registry found. Creating...");
						resolve(require('../../remote/registry.json'));
					}
				})
				.then(function(obj) {
					self.data = obj;
					return self.data;
				});
		}
	}
};

JSONSampleRegistry.prototype.mergeRemotes = function(data) {
	if (!data.remotes) {
		return Promise.resolve({
			added: 0
		})
	}
	return this.read()
		.then(function(result) {
			var myRemotes = result.remotes,
				theirRemotes = data.remotes,
				mergeStats = {
					added: 0
				},
				remoteName;
			for (remoteName in theirRemotes) {
				if (myRemotes.hasOwnProperty(remoteName)) {
					if (!isURLEqual(myRemotes[remoteName], theirRemotes[remoteName])) {
						// shouldn't collide, right? it's temporary anyway
						myRemotes[remoteName + "~1"] = theirRemotes[remoteName];
						mergeStats.added++;
					}
				} else {
					myRemotes[remoteName] = theirRemotes[remoteName];
					mergeStats.added++;
				}
			}
			return mergeStats;
		})
};

JSONSampleRegistry.prototype.merge = function(data, force) {
	return this.read()
		.then(function(result) {
			return merge(result, data, force);
		});
};

JSONSampleRegistry.prototype.add = function(name, entry, force) {
	if (this.isReadOnly) {
		return Promise.reject(new Error("json-sample: cannot add to read-only registry."));
	}
	return this.read()
		.then(function(data) {
			var samples = data.samples,
				keys,
				max,
				i;

			if (!force) {
				if (samples.hasOwnProperty(name)) {
					throw new Error("json-sample: sample " + name + " already exists in registry");
				}
				// Check for duplicates
				for (i = 0, keys = Object.keys(samples), max = keys.length; i < max; i++) {
					if (isURLEqual(entry.url, samples[keys[i]].url)) {
						throw new Error("json-sample: sample url " + entry.url + " already exists in registry.");
					}
				}
			}
			samples[name] = entry;
		});
};

JSONSampleRegistry.prototype.write = function() {
	if (this.isReadOnly) {
		return Promise.reject(new Error("json-sample: cannot write registry, because it is read-only."));
	}
	if (!this.data) {
		return Promise.reject(new Error("json-sample: nothing to write, data was not loaded."));
	}
	return write(this.path, this.data, { spaces: 2 });
};

module.exports = JSONSampleRegistry;