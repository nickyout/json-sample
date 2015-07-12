var Promise = require('promise'),
	fse = require('fs-extra'),
	sync = require("./registry/sync"),
	readJSON = Promise.denodeify(fse.readJSON),
	jsonDownload = require('./util/json-download');

module.exports = function() {
	var localRegistry = this.registry,
		emitter = this,
		numErrors = 0,
		myRegistrySamples,
		theirRequestedSamples;
	Promise.all([localRegistry.read(), readJSON('./json-samples.json')])
		.catch(function(err) {
			emitter.emit("log", {
				message: "could not read json-samples.json",
				error: err,
				isFatal: true
			});
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
									emitter.emit("log", {
										message: "syncing remotes from json-samples.json..."
									});
									// Then sync
									return sync(localRegistry, emitter, true)
										.then(function(stats) {
											numErrors += stats.numErrors;
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
					emitter.emit("log", {
						message: "cannot download",
						error: new Error("sample " + sampleName + " not present in registry"),
						isFatal: false
					});
				} else {
					downloadables.push(
						jsonDownload(myRegistrySamples[sampleName].url, theirRequestedSamples[sampleName])
							.then(function(result) {
								emitter.emit("log", {
									message: "saved to " + result.path
								});
							})
							.catch(function(err) {
								numErrors++;
								emitter.emit("log", {
									message: "failed to create",
									error: err,
									isFatal: false
								});
							})
					);
				}
			}
			return Promise.all(downloadables);
		})
		.then(function(results){
			emitter.emit("done", { numErrors: numErrors });
		});
};