var bindAll = require('./bind-all'),
	jsonDownload = require('./json-download'),
	Promise = require('promise'),
	fse = require('fs-extra'),
	readJSON = Promise.denodeify(fse.readJSON),
	writeJSON = Promise.denodeify(fse.outputJSON),
	url = require('url');

function JSONFile(path, bindAllMethods) {
	this.path = path;
	this.isRemote = !!url.parse(path || '', false, true).hostname;
	this.data = null;
	this.isReadOnly = this.isRemote;
	if (bindAllMethods) {
		bindAll(this);
	}
}

JSONFile.prototype.data = null;

JSONFile.prototype.isReadOnly = true;

JSONFile.prototype.isRemote = false;

JSONFile.prototype._getDefaultData = function() {
	throw new Error("_getDefaultData not implemented");
};

JSONFile.prototype.exists = function() {
	return fse.existsSync(this.path);
};

JSONFile.prototype.read = function() {
	var self = this,
		path = this.path;
	if (this.data) {
		return Promise.resolve(this.data);
	} else {
		if (this.isRemote) {
			// assume url
			return jsonDownload(this.path)
				.then(function(obj) {
					self.data = obj;
					return self.data;
				});
		} else {
			// assume local file
			return new Promise(
				function(resolve, reject) {
					if (fse.existsSync(path)) {
						resolve(readJSON(path));
					} else {
						// Just make a copy then.
						//log("no local registry found. Creating...");
						resolve(self._getDefaultData());
					}
				})
				.then(function(obj) {
					self.data = obj;
					return self.data;
				});
		}
	}
};

JSONFile.prototype.write = function() {
	if (this.isReadOnly) {
		return Promise.reject(new Error("json-sample: cannot write, file is considered read-only."));
	}
	if (!this.data) {
		return Promise.reject(new Error("json-sample: nothing to write, data was not loaded."));
	}
	return writeJSON(this.path, this.data, { spaces: 2 });
};

module.exports = JSONFile;