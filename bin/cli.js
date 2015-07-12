var argv = require('minimist')(process.argv.slice(2));
if (argv._.length > 0) {

} else {
	console.log("Usage: json-samples <url> [<dest>]");
	process.exit(1);
}