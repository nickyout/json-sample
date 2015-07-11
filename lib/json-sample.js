var fse = require("fs-extra"),
	extractStats = require('./extract-stats'),
	jsonDownload = require('./json-download'),
	Promise = require('promise'),
	JSONSampleList = require('./json-sample-list');

/**
 *
 * @param {String} url
 * @param {String} dest - path to output file
 * @returns {Promise}
 */
var getNumBytes = Promise.denodeify(function(path, callback) {
		fse.lstat(path, function(err, result) {
			if (err) {
				callback(err);
			}
			callback(null, result.size);
		});
	}),
	readJSON = Promise.denodeify(fse.readJSON),
	/**
	 *
	 * @param {String} srcPath
	 * @param {String} url
	 * @param {Array.<String>} tags
	 * @returns {Promise.<JSONSampleListEntry>}
	 */
	createEntry = function(srcPath, url, tags) {
		var author = this.author;
		return Promise
			.all([getNumBytes(srcPath), readJSON(srcPath)])
			.then(function (results) {
				return {
					author: author || 'anonymous',
					url: url,
					date: +new Date(),
					tags: tags || [],
					numBytes: results[0],
					stats: extractStats(results[1])
				}
			});
	};

/**
 * @typedef {Object} JSONSampleListEntry
 * @prop {String} author
 * @prop {String} url
 * @prop {Number} date - milliseconds since the Unix epoch (+new Date())
 * @prop {Array.<String>} tags
 * @prop {Number} numBytes
 * @prop {JSONStats} stats
 */

module.exports = {

	author: 'anonymous',

	/**
	 * @type {JSONSampleList}
	 */
	list: null,

	init: function(path) {
		var self = this,
			list = this.list = new JSONSampleList(path);
		this.list = list;
		return list.read(function() {
			self.author = list.author;
		});
	},

	/**
	 *
	 * @param {String} sampleName
	 * @param {String} url
	 * @param {Array.<String>} tags
	 * @param {String} [dest] - destination for the download
	 */
	add: function(sampleName, url, tags, dest) {
		var list = this.list;
		return list.read()
			.then(function() {
				dest || (dest = list.dest);
				jsonDownload(url, dest)
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
						promises.push(localList.merge(JSONSampleList(remotes[remoteName]), force));
					}
					return Promise.all(promises);
				} else if (remotes[remoteName]) {
					// Update one, if it exists
					return localList.merge(JSONSampleList(remotes[remoteName]), force);
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
