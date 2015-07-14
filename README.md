# json-sample
Like npm for json samples, but then distributed. 

## Introduction

json-sample is a node cli to browse and download json samples based on a registry. The point is to both easily find real/challenging json samples (as opposed to randomly generated ones) and prevent those files from bloating your repository. The advantage over using npm is that:
 
*   this tool provides insight on the size and content of a json file, 
*   that json files do *not* have to be accompanied by any `package.json`, 
*   that you can add your own json samples you found on the Internet to your own local registry and 
*   that you can share those samples simply by making your `registry.json` file downloadable on the Internet. 

It closely mimics the npm cli command scheme, so you should be able to start right away.  

## Installation:

Globally: 
```
$ npm install -g json-sample
$ json-sample --help
```

Or as a project dev dependency:
```
$ npm install json-sample --save-dev
$ node ./node_modules/.bin/json-sample --help
```

## How it works

Once installed, you can browse sample files using `json-samples search [<name>]`. Like npm, any string you pass will be used as substring for matching repositories (though json-samples only checks in the name). Aside from the name, you have a plethora of filtering options, like `--bytes=1MB` (at least 1MB), `--tags=json-rpc` (must at least contain this exact tag) `--exponential` (must contain exponential numbers). The point is that you can search easier by your testing intent. 

It will barf out a sexy result:

```
$ json-sample search
 name                           tags                           date          bytes homogen depth  #obj  #arr  #num  #str #bool
 test                                                          7/12/2015    1.09kB     0.2     1     5     0     0    25     0
 geo                            geo                            7/12/2015    2.91kB    0.25     7     4   127   242     5     0
 city-lots                      city-lots                      7/12/2015  180.99MB   0.333     7  0.6M    3M  7.8M  2.2M     0
```

Like npm, json-sample it can keep track of what you want to download in a local json file. It uses the file name `json-samples.json`, which is made by calling `json-sample init` or implicitly when you use `json-sample install --save <sample> <path>`. 

Once you have created a `json-samples.json` file that contains the samples you use, you can automatically have them installed by (assuming json-samples is a dev dependency) adding `"scripts": { "pretest": "node ./node_modules/.bin/json-samples install" }` in your `package.json`. It will only download files that are not present. 

## Usage
Type `json-sample --help` for this help message:

```
Usage:  json-sample init
        json-sample install
        json-sample install <name> <path> [--save]
        json-sample remove <name> [--save]
        json-sample sync [--force|-f]
        json-sample search [<name>] [--bytes=<hr>][--max-depth=<n>][--homogenity=<n>][--booleans=<n>]
                           [--strings=<n>][--numbers=<n>][--arrays=<n>][--objects=<n>][--nulls=<n>]
                           [--[no-]special-chars][--[no-]exponential][--[no-]float][--[no-]negative]
                           [--date=<hr>][--tags=<tag>,<tag>]
        json-sample add <name> <url> [--tags=<tag>,<tag>] [--force|-f]
        json-sample [<command>] -h|--help

Description:

    Search and download json samples. Register new json samples. Share your registry?
    Use -h|--help with a specific command to get specific help.
```

Each specific command has its own `--help` message. 

## Adding JSON samples
Github is not made to be a download service and for large JSON files it will even throw a server error. For Github urls, I recommend using https://cdn.rawgit.com or some other free cdn service. Also, for consistency sake, target the json file under a specific commit, *not* a branch like 'master'. 

The simplest form of adding a json file:

```
json-samples add <name> <url to json>
```

It extract the stats needed for `json-sample search` automatically. Try adding your own package.json file for fun!

## FAQ

*If we all use the same test data, we also share the flaws in the test files*

True. On the other hand, if you need to create the data yourself, you might forget corner cases that can be included in a shared test file. 

I hope that test files will eventually become authoritative -  
Yes. That is why, ideally, JSON test data needs to be sharpened over time. If these improvements are then shared, all users can benefit. 

*JSON files are not that big*

There is a JSON sample in the registry that is 180 MB big. I wanted that to be an option.  

*Is it safe?*

It's pretty darn alpha at this point. I've tested it by hand. So far, I trust it. 

*Why create another json file to put in my repo?*

I want it to be simple to try out. If you don't like it, remove the `json-samples.json` file, remove the `.json-sample` folder in your home dir, `npm remove` my tool and everything is gone. Also, no chance I screw up your precious package.json. 

## TODO

*   Make registry distribution more user friendly. 
