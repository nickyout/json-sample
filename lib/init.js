module.exports = function() {
	var samplesFile = this.samples,
		emitter = this;
	if (!samplesFile.exists()) {
		return samplesFile.read()
			.then(samplesFile.write)
			.then(function() {
				emitter.emit('log', {
					message: "created "+samplesFile.path+" in directory"
				});
			})
	} else {
		emitter.emit("log", {
			message: "file" + samplesFile.path + " already exists in directory"
		});
	}
};