var argv = require('minimist')(process.argv.slice(2)),
	jsonSample = require('../lib/registry/index');
if (argv._.length > 0) {
	jsonSample.download(argv._[0], argv._[1], function(err, path) {
		if (err) {
			console.error("Error: " + err.message);
		} else {
			console.log("Written to ", path);
			console.log(path);
		}
	});
} else {
	console.log("Usage: json-samples <url> [<dest>]");
	process.exit(1);
}