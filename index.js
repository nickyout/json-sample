var fse = require('fs-extra'),
	path = require('path'),
	Promise = require('promise'),
	readJSON = Promise.denodeify(fse.readJSON),
	writeJSON = Promise.denodeify(fse.writeJSON),
	JSONSampleRegistry = require('./lib/registry/class'),
	extractStats = require('./lib/registry/extract-stats'),
	search = require('./lib/registry/search'),
	sync = require("./lib/registry/sync"),
	jsonDownload = require('./lib/util/json-download');

var log = console.log.bind(console, "json-sample:"),
	logForced = function(str, forced) {
		log(str + (forced ? " (forced)" : ""));
	},
	logError = function(str, error, skipping) {
		log(str + ": \"" + error.message + "\"." + skipping ? " Skipping..." : "");
	},
	logDone = function(numErrors) {
		if (typeof numErrors === "number") {
			log("Done ("+ numErrors + " error"+(numErrors===1?"":"s")+").")
		} else {
			log("Done.");
		}
	};

var localRegistryPath = path.resolve(__dirname, 'registry.json'),
	localRegistry = new JSONSampleRegistry(localRegistryPath);

module.exports = {

	/**
	 * Get the latest sample specs from all remote registries listed under 'remotes'
	 * @param {Boolean} [force=false] - prefer remote sample specs over your own
	 */
	sync: function(force) {
		var totalStats;
		return sync(localRegistry, logError, force)
			.then(function(stats) {
				totalStats = stats;
				logForced("sync complete: "
					+ stats.added + " added, "
					+ stats.updated + " updated", stats.force);
			})
			.then(localRegistry.write)
			.done(function() {
				logDone(totalStats.numErrors);
			});
	},

	/**
	 * Add a new remote JSON to the registry
	 * @param {String} name - the name to use in the registry for this JSON
	 * @param {String} url - url to JSON file
	 * @param {Array.<String>} [tags=[]] - associated tags
	 * @param {Boolean} [force=false] - add even if name or url already exists in registry. Be careful with this.
	 */
	add: function(name, url, tags, force) {
		return localRegistry.read()
			.then(function(data) {
				if (data.samples.hasOwnProperty(name) && !force) {
					throw new Error("sample "+name+" already present in registry");
				}
				return jsonDownload(url).catch(function(err) {
					logError("Could not download JSON", err);
					throw err;
				});
			})
			.then(function(result) {
				return localRegistry.add(name, {
					url: url,
					date: +new Date(),
					tags: tags || [],
					numBytes: result.numBytes,
					stats: extractStats(result.obj)
				}, force);
			})
			.catch(function(err) {
				logError("could not create new entry", err);
				throw err;
			})
			.then(localRegistry.write)
			.then(function() {
				logForced("sample " + name + " added to registry", force);
			})
			.done(function() {
				logDone();
			});
	},

	/**
	 * Download all specified samples from the file json-samples.json in the current directory.
	 */
	install: function() {
		var numErrors = 0,
			myRegistrySamples,
			theirRequestedSamples;
		Promise.all([localRegistry.read(), readJSON('./json-samples.json')])
			.catch(function(err) {
				logError("could not read json-samples.json", err);
				throw err;
			})
			.then(function(results) {
				myRegistrySamples = results[0].samples;
				theirRequestedSamples = results[1].samples;

				// The request comes with remotes, but do we need them?
				if (results[1].remotes) {
					// First check if all requested samples are already known
					for (var sampleName in theirRequestedSamples) {
						if (!myRegistrySamples.hasOwnProperty(sampleName)) {
							// If not, assume we need the remotes
							return localRegistry.mergeRemotes(results[1])
								.then(function(stats) {
									// Did the remotes come with registries we did not yet now?
									if (stats.added) {
										log("syncing remotes from json-samples.json...");
										// Then sync
										return sync(localRegistry, logError, true)
											.then(function(stats) {
												numErrors += stats.numErrors;
												logForced("sync complete: "
													+ stats.added + " added, "
													+ stats.updated + " updated", stats.force);
											})
									}
								});
						}
					}
				}
			})
			// Assuming we've done the best we can do in getting a complete registry...
			.then(function() {
				var downloadables = [],
					sampleName;

				for (sampleName in theirRequestedSamples) {
					if (!myRegistrySamples.hasOwnProperty(sampleName)) {
						numErrors++;
						log("sample " + sampleName + " not present in registry. Skipping...");
					} else {
						downloadables.push(
							jsonDownload(myRegistrySamples[sampleName].url, theirRequestedSamples[sampleName])
								.then(function(result) {
									log("saved to " + result.path);
								})
								.catch(function(err) {
									numErrors++;
									logError("failed to create", err, true);
								})
						);
					}
				}
				return Promise.all(downloadables);
			})
			.done(function(results){
				logDone(numErrors);
			});
	},

	/**
	 * Search for JSON samples in the registry
	 * @param {JSONSampleQueryShorthanded} query
	 * @returns {Promise.<Array>} - the results
	 */
	search: function(query) {
		return localRegistry.read()
			.then(function(data) {
				return search(data, query);
			})
			.done(function(result) {
				log(result);
				logDone();
			});
	},

	/**
	 * Create a new json-samples.json file in the current directory.
	 * Does nothing if the file already exists.
	 * @returns {Promise}
	 */
	init: function() {
		if (!fse.existsSync('./json-samples.json')) {
			return localRegistry.read()
				.then(function(data) {
					data.samples = {};
					return writeJSON('./json-samples.json', data, { spaces: 2 });
				})
				.done(function() {
					log("created json-samples.json in directory");
				})
		} else {
			log("json-samples.json already exists in directory");
			return Promise.resolve();
		}
	}

};