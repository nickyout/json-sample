var jsonDownload = require('../util/json-download'),
	Promise = require('promise'),
	JSONSampleRegistry = require('./class');

/**
 * @typedef {Object} JSONSampleListEntry
 * @prop {String} url
 * @prop {Number} date - milliseconds since the Unix epoch (+new Date())
 * @prop {Array.<String>} tags
 * @prop {Number} numBytes
 * @prop {JSONStats} stats
 */

module.exports = {

	/**
	 * @type {JSONSampleList}
	 */
	list: null,

	init: function(path) {
		var list = this.list = new JSONSampleRegistry(path);
		this.list = list;
		return list.read();
	},

	/**
	 *
	 * @param {String} sampleName
	 * @param {String} url
	 * @param {Array.<String>} tags
	 * @param {String} [dest='.'] - destination for the download. Defaults to the current directory.
	 */
	add: function(sampleName, url, tags, dest) {
		dest || (dest = '.');
		var list = this.list;
		return list.read()
			.then(function() {
				return jsonDownload(url, dest)
			})
			.then(function(path) {
				return createEntry(sampleName, path, url, tags);
			})
			.then(list.add)
			.then(list.write)
			.done();
	},

	/**
	 * Add the samples data from another list to your own
	 * @param {String} remoteName
	 * @param {Boolean} [force=false] prefer remote data over own
	 */
	sync: function(remoteName, force) {
		var localList = this.list,
			mergeStats,
			remotes,
			promises;

		return localList
			.read()
			.then(function(data) {
				var remotes = data.remotes;
				if (!remoteName) {
					// update them all.
					promises = [];
					for (remoteName in remotes) {
						promises.push(localList.merge(JSONSampleRegistry(remotes[remoteName]), force));
					}
					return Promise.all(promises);
				} else if (remotes[remoteName]) {
					// Update one, if it exists
					return localList.merge(JSONSampleRegistry(remotes[remoteName]), force);
				}
				throw new Error("Cannot sync: remote " + remoteName + " not present in list");
			})
			.then(function(stats) {
				mergeStats = stats;
			})
			.then(localList.write)
			.done(function() {
				// Return what happened
				return mergeStats;
			});
	}
};
