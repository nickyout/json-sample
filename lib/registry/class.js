var fse = require('fs-extra'),
	Promise = require("promise"),
	read = Promise.denodeify(fse.readJSON),
	write = Promise.denodeify(fse.writeJSON),
	jsonDownload = require("../util/json-download"),
	url = require("url");

function isURLEqual(url1, url2) {
	var parsed1 = url.parse(url1, false, true),
		parsed2 = url.parse(url2, false, true);
	return (parsed1.hostname == parsed2.hostname && parsed1.path == parsed2.path);
}

function merge(myList, theirList, force) {
	var mySamples = myList.samples,
		theirSamples = theirList.samples,
		mergeStats = {
			added: 0,
			replaced: 0,
			omitted: 0
		},
		mySamplesHave,
		i,
		imax = theirSamples.length,
		j,
		jmax = mySamples.length;

	for (i = 0; i < imax; i++) {
		mySamplesHave = false;
		for (j = 0; j < jmax; j++) {
			if (isURLEqual(theirSamples[i].url, mySamples[j].url)) {
				// Same source. Who to believe?
				if (force) {
					// cloning might be decent
					mySamples[j] = theirSamples[i];
					mergeStats.replaced++;
				} else {
					mergeStats.omitted++;
				}
				mySamplesHave = true;
				break;
			}
		}
		if (!mySamplesHave) {
			// cloning might be decent
			mySamples.push(theirSamples[i]);
			mergeStats.added++;
		}
	}
}

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

JSONSampleRegistry.prototype.merge = function(jsonSampleList, force) {
	return Promise	.all([this.read, jsonSampleList.read])
		.then(function(results) {
			merge(results[0], results[1], force);
		})
		.done();
};

JSONSampleRegistry.prototype.add = function(name, entry, force) {
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
	return write(this.path, this.data, { spaces: 2 })
		.done();
};

module.exports = JSONSampleRegistry;