var sync = require("./registry/sync");

module.exports = function(force) {
	var localRegistry = this.registry,
		numErrors,
		emitter = this;
	return sync(localRegistry, emitter, force)
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