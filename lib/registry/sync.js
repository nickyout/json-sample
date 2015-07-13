var jsonDownload = require('../util/json-download');

/**
 * Fetches the samples of all remote registries listed in localRegistry
 * and adds them to localRegistry. Does not write to disk.
 * @param {JSONSampleRegistry} localRegistry
 * @param {EventEmitter} emitter
 * @param {Boolean} force
 * @return {Promise}
 */
module.exports = function(localRegistry, emitter, force) {
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
							emitter.emit('log', {
								message: 'failed to read registry',
								error: err
							});
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
								emitter.emit('log-error', {
									message: 'failed to sync with registry',
									error: err
								});
							}));
				}
			}
			return Promise.all(merges);
		})
		.then(function(results) {
			var i, totalStats = {
				added: 0,
				updated: 0,
				numErrors: numErrors,
				force: force
			};
			for (i = 0; i < results.length; i++) {
				if (results[i]) {
					totalStats.added += results[i].added;
					totalStats.updated += results[i].updated;
				}
			}
			emitter.emit("log", {
				"message": "sync complete: "
				+ totalStats.added + " added, "
				+ totalStats.updated + " updated",
				isForced: force
			});
			return totalStats;
		})
};