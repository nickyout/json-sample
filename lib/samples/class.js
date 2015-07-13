var JSONFile = require('../util/json-file');

function JSONSamples(path, registry) {
	JSONFile.call(this, path, true);
	this.registry = registry;
}

JSONSamples.prototype = new JSONFile();

JSONSamples.prototype._getDefaultData = function() {
	return this.registry.read()
		.then(function(data) {
			var remoteName,
				remotes = {};
			for (remoteName in data.remotes) {
				remotes[remoteName] = data.remotes[remoteName];
			}
			return {
				remotes: remotes,
				samples: {}
			}
		})
};

module.exports = JSONSamples;