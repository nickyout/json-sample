var fse = require('fs-extra'),
	path = require('path'),
	Promise = require('promise'),
	readJSON = Promise.denodeify(fse.readJSON),
	JSONSampleRegistry = require('./lib/registry/class'),
	extractStats = require('./lib/registry/extract-stats'),
	jsonDownload = require('./lib/util/json-download');

var log = console.log.bind(console, "json-sample:"),
	logDone = function(numErrors) {
		if (typeof numErrors === "number") {
			log("Done ("+ numErrors + " error"+(numErrors===1?"":"s")+").")
		} else {
			log("Done");
		}
	};

var localRegistryPath = path.resolve(__dirname, 'registry.json'),
	localRegistry = new JSONSampleRegistry(localRegistryPath);

module.exports = {

	sync: function(force) {
		var remoteNames = [],
			numErrors = 0;
		return localRegistry.read()
			.then(function(result) {
				var remotes = result.remotes,
					downloads = [],
					remoteName;
				for (remoteName in remotes) {
					remoteNames.push(remoteName);
					downloads.push(
						jsonDownload(remotes[remoteName])
							.catch(function(err) {
								numErrors++;
								log('failed to read registry: "' + err.message + '". Skipping...');
							})
					);
				}
				return Promise.all(downloads);
			})
			.then(function(results) {
				var merges = [],
					i;
				for (i = 0; i < results.length; i++) {
					if (results[i]) {
						merges.push(
							localRegistry.merge(results[i].obj, force)
								.catch(function(err) {
									numErrors++;
									log('failed to sync with registry:"' + err.message + '". Skipping...');
								}));
					}
				}
				return Promise.all(merges);
			})
			.then(function(results) {
				var i, totalStats = {
					added: 0,
					updated: 0
				};
				for (i = 0; i < results.length; i++) {
					if (results[i]) {
						totalStats.added += results[i].added;
						totalStats.updated += results[i].updated;
					}
				}
				log("sync complete: " + totalStats.added + " added, " + totalStats.updated + " updated.");
			})
			.then(localRegistry.write)
			.done(function() {
				logDone(numErrors);
			});
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
			.then(function() {
				log("sample " + name + " added to registry.");
			})
			.done(function() {
				logDone();
			});
	},

	install: function() {
		var numErrors = 0;
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
									numErrors++;
									log("failed to create: \"" + err.message + "\". Skipping...");
								})
						);
					}
				}
				return Promise.all(downloadables);
			})
			.done(function(results){
				logDone(numErrors);
			});
	},

	search: function(grepStr, options) {

	}

};