var jsonDownload = require('./util/json-download'),
	extractStats = require('./registry/extract-stats');

module.exports = function(name, url, description, tags, force) {
	var localRegistry = this.registry,
		emitter = this;
	return localRegistry.read()
		.then(function(data) {
			if (!name || !url) {
				throw new Error("No name + url specified");
			}
			if (data.samples.hasOwnProperty(name) && !force) {
				throw new Error("sample "+name+" already present in registry");
			}
			return jsonDownload(url).catch(function(err) {
				throw {
					message: "Could not download JSON",
					error: err
				};
			});
		})
		.then(function(result) {
			return localRegistry.add(name, {
				url: url,
				date: +new Date(),
				tags: tags || [],
				description: description || '',
				numBytes: result.numBytes,
				stats: extractStats(result.obj)
			}, force);
		})
		.catch(function(err) {
			throw {
				message: "could not create new entry",
				error: err
			};
		})
		.then(localRegistry.write)
		.then(function() {
			emitter.emit("log", {
				message: "sample " + name + " added to registry",
				op: "add"
			});
		})
		.then(function() {
			emitter.emit("done", {});
		});
};