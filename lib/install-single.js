var Promise = require('promise'),
	jsonDownload = require('./util/json-download'),
	resolvePath = require('./util/resolve-path'),
	bytes = require('bytes'),
	fse = require('fs-extra');

module.exports = function(name, path) {
	var localRegistry = this.registry,
		emitter = this,
		localRegistrySamples,
		resolvedPath;
	return localRegistry.read()
		.then(function(data) {
			localRegistrySamples = data.samples;
			if (!localRegistrySamples.hasOwnProperty(name)) {
				throw new Error("x cannot install sample: \""+name+"\" not known in the registry")
			}
			resolvedPath = resolvePath(path, localRegistrySamples[name].url)
		})
		.then(function() {
			if (!fse.existsSync(resolvedPath)) {
				return jsonDownload(localRegistrySamples[name].url, path)
					.then(function(stats) {
						emitter.emit("log", {
							"message": "+ saved sample \"" + name + "\" to " + stats.path + " (" + bytes(stats.numBytes) + ")"
						});
						return { path: resolvedPath };
					});
			} else {
				emitter.emit("log", {
					"message": "  skipping sample \"" + name + "\" because " + resolvedPath + " already exists"
				});
				return { path: resolvedPath };
			}
		})

};