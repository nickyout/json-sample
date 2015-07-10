var argv = require('minimist')(process.argv.slice(2));
if (argv._.length > 0) {
	require('../index')(argv._[0], argv._[1]);
} else {
	console.log("Usage: json-samples <url> [<dest>]");
	process.exit(1);
}