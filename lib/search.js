var search = require('./registry/search');

module.exports = function(query) {
	var localRegistry = this.registry,
		emitter = this;
	return localRegistry.read()
		.then(function(data) {
			return search(data, query);
		})
		.then(function(result) {
			emitter.emit("query", result);
		});
};