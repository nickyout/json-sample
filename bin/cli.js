var argv = require('minimist')(process.argv.slice(2)),
	path = require('path'),
	help = require('help'),
	parseQuery = require('../lib/util/parse-query'),
	Promise = require('promise'),
	api = require("../index");

var argEtcWhiteList = ['_', 'h', 'help', 'v', 'verbose', 'f', 'force', 'V', 'version'];

var manMap = {
	'search': 'search.txt',
	'sync': 'sync.txt',
	'install': 'install.txt',
	'init': 'init.txt',
	'register': 'register.txt',
	'default': 'index.txt'
};

var manTopic = '';

var argMap = {
	'tags': 		[String, 'tags'],
	'date': 		[String, 'date'],
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

function isArgValid(arg) {
	return argMap.hasOwnProperty(arg) || argEtcWhiteList.indexOf(arg) > -1;
}

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
	parseQuery(result, isVerbose).forEach(function(str) {
		console.log(str);
	});
});

function runCommand(argv) {
	var command = argv._[0],
		tags = null,
		force = argv.force || argv.f,
		query,
		arg;

	if (!command || argv.h || argv.help) {
		barfHelp(command, 0);
		return Promise.resolve();
	} else if (argv.V || argv.version) {
		console.log("Enter version here.");
		return Promise.resolve();
	} else if (argv._.length > 0) {
		// Sanity check
		for (arg in argv) {
			if (!isArgValid(arg)) {
				return Promise.reject({
					error: new Error("Unknown option: " + arg + "\n"),
					needHelp: true
				});
			}
		}
		// Run a command
		switch (command) {
			case "init":
				manTopic = command;
				return api.init();
			case "install":
				manTopic = command;
				return api.install();
			case "add":
				manTopic = command;
				if (argv.tags) {
					tags = (argv.tags + '').split(',');
				}
				return api.add(argv._[1], argv._[2], tags, force);
			case "sync":
				manTopic = command;
				return api.sync(force);
			case "search":
				manTopic = command;
				query = {
					name: argv._[1] || ''
				};
				for (arg in argv) {
					if (argMap.hasOwnProperty(arg)) {
						query[argMap[arg][1]] = argMap[arg][0](argv[arg]);
					}
				}
				if (isVerbose) {
					console.log("json-sample: Search query = ", JSON.stringify(query));
				}
				return api.search(query);
			default:
				// No such command
				return Promise.reject({
					error: new Error("Unknown command " + command + "\n"),
					needHelp: true
				});
		}
	}
}

function barfHelp(topic, exitCode) {
	var helpFile = path.resolve(__dirname, '..', 'man', manMap[topic] || manMap['default']);
	help(helpFile)(exitCode || 0);
}

runCommand(argv)
	.catch(function(e) {
		if (e.error) {
			console.error("json-sample:", e.error.message);
		}
		if (e.needHelp) {
			barfHelp(manTopic, 1);
		} else {
			process.exit(1);
		}
	}).done();