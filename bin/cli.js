#!/usr/bin/env node
var prompt = require("cli-prompt"),
	argv = require('minimist')(process.argv.slice(2)),
	path = require('path'),
	help = require('help'),
	parseQuery = require('../lib/util/parse-query'),
	Promise = require('promise'),
	api = require("../index");

var prefix = 'json-sample: ';

var regCommaSep = /[,\s]\s*/g;

var argWhiteList = [
	'_',
	'm', 'description',
	'h', 'help',
	'v', 'verbose',
	'f', 'force',
	'V', 'version',
	'save'
];

var manMap = {
	'search': 'search.txt',
	'sync': 'sync.txt',
	'install': 'install.txt',
	'init': 'init.txt',
	'add': 'add.txt',
	'remove': 'remove.txt',
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
	return argMap.hasOwnProperty(arg) || argWhiteList.indexOf(arg) > -1;
}

var isVerbose = !!(argv.verbose || argv.v);

api.on("log", function(e) {
	var message = prefix;
	if (e.error) {
		message += 'X ';
	} else switch (e.op) {
		case "add":
			message += "+ ";
			break;
		case "remove":
			message += "- ";
			break;
		default:
			message += "  ";
			break;
	}
	message += e.message;
	if (e.error) {
		// always non-fatal
		message += ": " + e.error.message + ". Skipping...";
	}
	console.log(message);
});
api.on("done", function(stats) {
	var numErrors = stats.numErrors || 0;
	console.log(prefix + "Done (" + numErrors + " error" + ((numErrors === 1) ? "" : "s") + ").");
});
api.on('query', function (result) {
	parseQuery(result, isVerbose).forEach(function(str) {
		console.log(str);
	});
});

function runCommand(argv) {
	var command = manTopic = argv._[0],
		tags = null,
		description = (argv.description || argv.m || '').substr(0, 60),
		force = argv.force || argv.f,
		doSave = !!argv.save,
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
					message: "invalid syntax",
					error: new Error("unknown option \"" + arg + "\""),
					needHelp: true
				});
			}
		}
		// Run a command
		switch (command) {
			case "init":
				return api.init();
			case "install":
				if (argv._[1]) {
					return api.installSave(argv._[1], argv._[2], doSave);
				} else {
					return api.install();
				}
			case "remove":
				return api.removeSave(argv._[1], doSave);
			case "add":
				if (argv._[1]) {
					if (argv.tags) {
						tags = (argv.tags + '').split(regCommaSep);
					}
					return api.add(argv._[1], argv._[2], description, tags, force);
				} else {
					return new Promise(
						function(resolve, reject) {
							api.emit("log", {
								message: "(Ctrl+C to abort)"
							});
							prompt.multi([{
								key: 'name',
								label: 'name (required)',
								validate: function(val) {
									if (!val) { throw new Error("You must specify a name."); }
								}
							}, {
								key: 'url',
								label: 'url (required)',
								validate: function(val) {
									if (!val) { throw new Error("You must specify an url."); }
								}
							}, {
								key: 'description',
								label: 'description (max 60 characters)',
								validate: function(val) {
									if (val.length > 60) { throw new Error("Your description exceeds 60 characters (" + val.length + ")"); }
								}
							}, {
								key: 'tags',
								label: 'tags (comma-separated)'
							}], resolve);
						})
						.then(function(answers) {
							return api.add(
								answers.name,
								answers.url,
								answers.description,
								(answers.tags + '').split(regCommaSep),
								force
							);
						});
				}
			case "sync":
				return api.sync(force);
			case "search":
				query = {
					match: argv._[1] || ''
				};
				for (arg in argv) {
					if (argMap.hasOwnProperty(arg)) {
						query[argMap[arg][1]] = argMap[arg][0](argv[arg]);
					}
				}
				if (isVerbose) {
					api.emit("log", {
						"message": "Search query = " + JSON.stringify(query)
					});
				}
				return api.search(query);
			default:
				// No such command
				return Promise.reject({
					message: 'invalid syntax',
					error: new Error("unknown command " + command + "\n"),
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
		var errorStr;
		if (e.message) {
			errorStr = prefix + "(Fatal) " + e.message;
			if (e.error) {
				errorStr += ": " + e.error.message;
			}
			console.error(errorStr + "\n");
		}
		if (e.needHelp) {
			barfHelp(manTopic, 1);
		} else {
			process.exit(1);
		}
	}).done();
