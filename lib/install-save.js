var Promise = require("promise"),
	installSingle = require('./install-single');

module.exports = function(name, path, doSave) {
	var samplesFile = this.samples,
		resolvedPath,
		emitter = this;
	if (!name || !path) {
		return Promise.reject({
			message: "cannot install new sample: both <name> and <path> must be specified",
			needHelp: true
		});
	}
	return Promise.all([samplesFile.read(), installSingle.call(this, name, path)])
		.then(function(results) {
			if (doSave) {
				resolvedPath = results[1].path;
				results[0].samples[name] = resolvedPath;
				return samplesFile.write()
					.then(function() {
						emitter.emit("log", {
							message: "saved \""+name+"\": \""+resolvedPath+"\" to " + samplesFile.path,
							op: "add"
						})
					});
			}
		})
		.then(function() {
			emitter.emit("done", {});
		})

};