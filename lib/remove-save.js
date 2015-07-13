var fse = require('fs-extra'),
	Promise = require('promise'),
	deleteFile = Promise.denodeify(fse.delete);

module.exports = function(name, doSave) {
	var samplesFile = this.samples,
		emitter = this,
		path;
	return samplesFile.read()
		.then(function(data) {
			path = data.samples[name];
			if (!path) {
				throw new Error("could not remove: sample \""+name+"\" not found in " + samplesFile.path);
			}
			var actions = [];
			if (fse.existsSync(path)) {
				actions.push(deleteFile(path)
					.then(function() {
						emitter.emit("log", {
							message: "- removed file \"" + path + "\""
						});
					})
				);
			}
			if (doSave) {
				delete data.samples[name];
				actions.push(samplesFile.write()
					.then(function() {
						emitter.emit("log", {
							message: "- removed sample \"" + name + "\" from json-samples.json"
						});
					}));
			}
			return Promise.all(actions);
		})
};