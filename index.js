var fse = require('fs-extra'),
	path = require('path'),
	Promise = require('promise'),
	readJSON = Promise.denodeify(fse.readJSON),
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

	search: function(query) {
		return localRegistry.read()
			.then(function(data) {
				return search(data, query);
			})
			.done(function(result) {
				log(result);
				logDone();
			});
	}

};