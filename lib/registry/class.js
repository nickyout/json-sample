var Promise = require("promise"),
	url = require("url"),
	JSONFile = require('../util/json-file');

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
 * Represent a registry.
 * @param {String} path - path to registry.json
 * @constructor
 */
function JSONSampleRegistry(path) {
	JSONFile.call(this, path, true);
}

JSONSampleRegistry.prototype = new JSONFile();

JSONSampleRegistry.prototype._getDefaultData = function() {
	return require("../../remote/registry.json");
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

module.exports = JSONSampleRegistry;