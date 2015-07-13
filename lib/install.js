var Promise = require('promise'),
	sync = require("./registry/sync"),
	installSingle = require('./install-single');

module.exports = function() {
	var localRegistry = this.registry,
		localSamples = this.samples,
		self = this,
		emitter = this,
		numErrors = 0,
		myRegistrySamples,
		theirRequestedSamples;
	return Promise.all([localRegistry.read(), localSamples.read()])
		.then(function(results) {
			myRegistrySamples = results[0].samples;
			theirRequestedSamples = results[1].samples;

			if (Object.keys(theirRequestedSamples).length === 0) {
				throw new Error("cannot install samples: there is nothing specified to install.");
			}

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
				downloadables.push(
					installSingle.call(self, sampleName, theirRequestedSamples[sampleName], false)
					.catch(function(err) {
						numErrors++;
						emitter.emit("log", {
							message: "failed to create",
							error: err
						});
					})
				);
			}
			return Promise.all(downloadables);
		})
		.then(function(results){
			emitter.emit("done", { numErrors: numErrors });
		});
};