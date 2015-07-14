var fse = require('fs-extra'),
	Promise = require('promise'),
	deleteFile = Promise.denodeify(fse.delete);

module.exports = function(name, doSave) {
	var sampleFile = this.samples,
		emitter = this,
		path;
	if (!name) {
		return Promise.reject({
			message: "could not remove: you must specify a sample <name>",
			needHelp: true
		})
	}
	return sampleFile.read()
		.then(function(data) {
			path = data.samples[name];
			if (!path) {
				throw new Error("could not remove: sample \""+name+"\" not found in " + sampleFile.path);
			}
			var actions = [];
			if (fse.existsSync(path)) {
				actions.push(deleteFile(path)
					.then(function() {
						emitter.emit("log", {
							message: "removed file \"" + path + "\"",
							op: 'remove'
						});
					})
				);
			} else {
				emitter.emit("log", {
					message: "file \"" + path + "\" does not exist"
				})
			}
			if (doSave) {
				delete data.samples[name];
				actions.push(sampleFile.write()
					.then(function() {
						emitter.emit("log", {
							message: "removed sample \"" + name + "\" from " + sampleFile.path,
							op: 'remove'
						});
					}));
			}
			return Promise.all(actions);
		})
		.then(function() {
			emitter.emit("done", {})
		})
};