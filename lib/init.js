var fse = require('fs-extra'),
	Promise = require('promise'),
	writeJSON = Promise.denodeify(fse.writeJSON);

module.exports = function() {
	var localRegistry = this.registry,
		emitter = this;
	if (!fse.existsSync('./json-samples.json')) {
		return localRegistry.read()
			.then(function(data) {
				data.samples = {};
				return writeJSON('./json-samples.json', data, { spaces: 2 });
			})
			.then(function() {
				emitter.emit('log', {
					message: "created json-samples.json in directory"
				});
			})
	} else {
		emitter.emit("log", {
			message: "json-samples.json already exists in directory"
		});
		return Promise.resolve();
	}
};