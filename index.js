var fse = require('fs-extra'),
	path = require('path'),
	Promise = require('promise'),
	readJSON = Promise.denodeify(fse.readJSON),
	JSONSampleRegistry = require('./lib/registry/class'),
	extractStats = require('./lib/registry/extract-stats'),
	jsonDownload = require('./lib/util/json-download');

var log = console.log.bind(console, "json-sample:");

var localRegistryPath = path.resolve(__dirname, 'registry.json'),
	localRegistry = new JSONSampleRegistry(localRegistryPath);

module.exports = {

	sync: function() {

	},

	add: function(name, url, tags, force) {
		return jsonDownload(url)
			.catch(function(err) {
				log("Could not download JSON: \"" + err.message + "\"");
				throw err;
			})
			.then(function(result) {
				return localRegistry.add(name, {
					url: url,
					date: +new Date(),
					tags: tags || [],
					numBytes: result.numBytes,
					stats: extractStats(result.obj)
				}, force);
			})
			.catch(function(err) {
				log("Could not create new entry: \"" + err.message + "\"");
				throw err;
			})
			.then(localRegistry.write)
			.done();
	},

	install: function() {
		Promise.all([readJSON('./json-samples.json'), localRegistry.read()])
			.catch(function(err) {
				log("Could not read json-samples: "+ err.message);
				throw err;
			})
			.then(function(results) {
				var requestedJSON = results[0],
					registrySamples = results[1].samples,
					downloadables = [],
					jsonName;

				for (jsonName in requestedJSON) {
					if (!registrySamples.hasOwnProperty(jsonName)) {
						log("sample " + jsonName + " not present in registry. Skipping...");
					} else {
						downloadables.push(
							jsonDownload(registrySamples[jsonName].url, requestedJSON[jsonName])
								.then(function(result) {
									log("saved to " + result.path);
								})
								.catch(function(err) {
									log("failed to create: \"" + err.message + "\". Skipping...");
								})
						);
					}
				}
				return Promise.all(downloadables);
			})
			.done(function(results){
				log("Done.");
			});
	},

	search: function(grepStr, options) {

	}

};