var Promise = require('promise'),
	stream = require('stream'),
	util = require('util');

function ReadFileLength() {
	// OTL
	stream.Transform.call(this);

	var self = this;
	this.numBytes = 0;
	this.on('pipe', function() {
		self.numBytes = 0;
	});
	this.on('finish', function() {
		self.emit('buffer-length', self.numBytes);
	});
}

util.inherits(ReadFileLength, stream.Transform);

// Must be defined AFTER inherits
ReadFileLength.prototype._transform = function(buf, encoding, callback) {
	if (encoding) {
		this.numBytes += Buffer.byteLength(buf, encoding);
	} else {
		this.numBytes += buf.length;
	}
	callback(null, buf);
};

module.exports = ReadFileLength;