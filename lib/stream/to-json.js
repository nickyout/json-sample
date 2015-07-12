var stream = require('stream'),
	util = require('util');
util.inherits(ToJSON, stream.Writable);

function ToJSON(cb) {
	if (!(this instanceof ToJSON)) {
		return new ToJSON(cb);
	}
	this.json = '';
	var self = this;
	this.on('pipe', function() {
		self.json = '';
	});
	this.on('finish', function() {
		try {
			var response = JSON.parse(self.json);
			cb(null, response);
		} catch (err) {
			self.emit('error', err);
			cb(err);
		}
	});
	stream.Writable.call(this);
}

ToJSON.prototype._write = function(data, encoding, callback) {
	if (!encoding) {
		this.json += data.toString('utf-8');
	} else {
		this.json += data;
	}
	callback();
};

module.exports = ToJSON;