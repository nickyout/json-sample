var argv = require('minimist')(process.argv.slice(2)),
	path = require('path'),
	help = require('help')(path.resolve(__dirname, 'help.txt')),
	logQuery = require('./stringify-query'),
	Promise = require('promise'),
	api = require("../index");

var argMap = {
	'tags': 		[String, 'tags'],
	'bytes': 		[String, 'numBytes'],
	'max-depth': 	[Number, 'stats.maxDepth'],
	'objects': 		[Number, 'stats.object.amount'],
	'arrays': 		[Number, 'stats.array.amount'],
	'booleans': 	[Number, 'stats.boolean.amount'],
	'strings': 		[Number, 'stats.string.amount'],
	'special-chars':[Boolean, 'stats.hasSpecialChars'],
	'numbers': 		[Number, 'stats.number.amount'],
	'float': 		[Boolean, 'stats.number.hasFloat'],
	'exponential': 	[Boolean, 'stats.number.hasExponential'],
	'negative': 	[Boolean, 'stats.number.hasNegative'],
	'nulls': 		[Number, 'stats.null.amount'],
	'homogen': 		[Number, 'stats.object.homogenity'],
	'homogenity': 	[Number, 'stats.object.homogenity']
};

var isVerbose = !!(argv.verbose || argv.v);

api.on("log", function(e) {
	if (e.error) {
		if (e.isFatal) {
			console.error("json-sample: Fatal error: " + e.message + ": " + e.error.message);
		} else {
			console.error("json-sample: " + e.message + ": " + e.error.message + ". Skipping...");
		}
	} else {
		console.log("json-sample: " + e.message);
	}
});
api.on("done", function(stats) {
	var numErrors = stats.numErrors || 0;
	console.log("json-sample: Done (" + numErrors + " error" + ((numErrors === 1) ? "" : "s") + ").");
});
api.on('query', function (result) {
	logQuery(result, isVerbose).forEach(function(str) {
		console.log(str);
	});
});

function runCommand(argv) {
	var command,
		tags = null,
		force = argv.force || argv.f,
		query,
		arg;
	if (argv.help) {
		help(0);
		return Promise.resolve();
	} else if (argv._.length > 0) {
		// Run a command
		command = argv._[0];
		switch (command) {
			case "init":
				return api.init();
			case "install":
				return api.install();
			case "add":
				if (argv.tags) {
					tags = (argv.tags + '').split(',');
				}
				return api.add(argv._[1], argv._[2], tags, force);
			case "sync":
				return api.sync(force);
			case "search":
				query = {
					name: argv._[1] || ''
				};
				for (arg in argv) {
					if (argMap.hasOwnProperty(arg)) {
						query[argMap[arg][1]] = argMap[arg][0](argv[arg]);
					}
				}
				if (isVerbose) {
					console.log("Search query:", JSON.stringify(query, null, 4));
				}
				return api.search(query);
			default:
				// No such command
				return Promise.reject({
					error: new Error("Unknown command " + command),
					needHelp: true
				});
		}
	} else {
		// No command to run
		return Promise.reject({
			//error: new Error("No command specified.");
			needHelp: true
		});
	}
}

runCommand(argv)
	.catch(function(e) {
		if (e.error) {
			console.error(e.error.message);
		}
		if (e.needHelp) {
			help(1);
		} else {
			process.exit(1);
		}
	}).done();