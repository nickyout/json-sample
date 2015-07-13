module.exports = function(force) {
	var localRegistry = this.registry,
		numErrors,
		emitter = this;
	return localRegistry.sync(null, force, emitter)
		.then(function(stats) {
			numErrors = stats.numErrors;
		})
		.then(localRegistry.write)
		.then(function() {
			emitter.emit("done", {
				numErrors: numErrors
			});
		});
};