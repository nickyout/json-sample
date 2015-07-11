var fse = require('fs-extra'),
	path = require('path'),
	Promise = require('promise'),
	readJSON = Promise.denodeify(fse.readJSON),
	JSONSampleRegistry = require('./lib/registry/class'),
	jsonDownload = require('./lib/util/json-download');

var log = console.log.bind(console);

var rootDir = __dirname,
	localRegistryPath = path.resolve(rootDir, 'registry.json');

var localRegistry = new JSONSampleRegistry(localRegistryPath),
	// Temporary
	defaultRemoteRegistry = new JSONSampleRegistry(path.resolve(rootDir, 'remote', 'registry.json'));

module.exports = {

	sync: function() {

	},

	install: function(target, doSave) {
		if (!target) {
			// install all
			Promise.all([readJSON('./json-samples.json'), localRegistry.read()])
				.then(function(results) {

				})
				.catch(function(err) {
					log("Could not read json-samples: "+ err.message);
				});
		}
	},

	remove: function(target, doSave) {

	},

	search: function(grepStr, options) {

	}

};