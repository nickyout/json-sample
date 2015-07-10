var argv = require('minimist')(process.argv.slice(2));
if (argv._.length > 0) {
	require('../index')(argv._[0], argv._[1], function(err, result) {
		if (err) {
			console.error("Error: " + err.message);
		} else {
			console.log("Written to ", result.path);
			console.log(result.meta);
		}
	});
} else {
	console.log("Usage: json-samples <url> [<dest>]");
	process.exit(1);
}