# json-sample
Like npm for json test data, but with your personal registry. 

*After some thinking I have seen the error in trying to construct a system to replace npm merely for the sake of redundant statistics. I will probably be using npm for json fixtures instead of this. Regardless, if you like what you see, fork it and enjoy yourselves.*

## Introduction

json-sample is a node cli to browse and download json samples based on urls from a registry. The point is to both easily find real/challenging json samples (as opposed to randomly generated ones) and prevent those files from bloating your repository. The advantage over using npm is that:
 
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

## Usage
Type `json-sample --help` for this help message:

```
Usage:  json-sample [<command>] [-h|--help]

Description:

    Search and download json samples. Add new json samples. Share your registry?
    Use -h|--help with a specific command to get specific help.

Commands:
    init                    Create a json-sample.json file in the current directory
    sync                    Update your local registry with the latest changes of remote registries
    search                  Search your registry for specific json files
    install                 Download json samples from the registry and/or add them to your json-samples file
    remove                  Remove downloaded json samples and/or remove them from your json-samples file
    add                     Add/update an entry in your local registry representing a json file.

```

Each specific command has its own `--help` message. 

## How it works

### Searching

Once installed, you can browse sample files using `json-samples search [<name>]`. Like npm, any string you pass will be used as substring for matching repositories (though json-samples only checks in the name). Aside from the name, you have a plethora of filtering options, like `--bytes=1MB` (at least 1MB), `--tags=json-rpc` (must at least contain this exact tag) `--exponential` (must contain exponential numbers). The point is that you can search easier by your testing intent. 

It will barf out a sexy result:

```
$ json-sample search
name                           description                                                  size      date        | homogen depth  #obj  #arr  #num  #str #bool | tags                          
city-lots                                                                                   180.99MB  7/12/2015   |   0.333     7  0.6M    3M  7.8M  2.2M     0 | city-lots                     
test                           node-cli-prompt package.json file for testing purposes       702B      7/14/2015   |   0.166     2     6     1     0    20     0 | package.json                  
test2                          Some package.json file for testing                           708B      7/14/2015   |   0.166     2     6     2     0    22     0 | okay let's try this shinayz   
test4                          Inception (v3)                                               1.08kB    7/15/2015   |   0.166     5    12     1    15     3     5 | inc epti on!                  
```

## Downloading

Downloading is done by referring to a JSON sample by its name in the registry, followed by the relative path it should be saved to. It creates any directories that do not yet exist. If a file already exists on the file destination, it is left untouched. 

```
$ json-sample install city-lots test/fixtures/json/ --save 
json-sample: + saved sample "city-lots" to /srv/http/json-sample/test/fixtures/json/citylots.json (180.99MB)
json-sample: + saved "city-lots": "/srv/http/json-sample/test/fixtures/json/citylots.json" to ./json-sample.json
json-sample: Done (0 errors).
```

Like npm, json-sample it can keep track of what you want to download in a local json file. It uses the file name `json-samples.json`, which is made by calling `json-sample init` or implicitly when you use `json-sample install --save <sample> <path>`. 

Once you have created a `json-samples.json` file that contains the samples you use, you can get them to be automatically installed by adding `"scripts": { "pretest": "node ./node_modules/.bin/json-samples install" }` in your `package.json` (assuming json-samples is a `devDependency`). It will only download files that are not present. 

## Adding
Github is not made to be a download service and for large JSON files it will even throw a server error. For Github urls, I recommend using https://cdn.rawgit.com or some other free cdn service. Also, for consistency sake, target the json file under a specific commit, *not* a branch like 'master'. 

The simplest form of adding a json file:

```
json-samples add <name> <url/to/file.json>
```

It extract the stats needed for `json-sample search` automatically. Try adding your own package.json file for fun!

## FAQ

*If we all use the same test data, we also share the flaws in the test files*

True. On the other hand, if you need to create the data yourself, you might forget corner cases that can be included in a shared test file. Furthermore, if any improvements on a json test file get shared, all users can benefit. 

*JSON files are not that big*

There is a JSON sample in the registry that is 180 MB big. I wanted that to be an option.  

*Is it safe?*

It's pretty darn alpha at this point. I've tested it by hand. So far, I trust it. 

*Why create another json file to put in my repo?*

I want it to be simple to try out. If you don't like it, remove the `json-samples.json` file, remove the `.json-sample` folder in your home dir, `npm remove` my tool and everything is gone. Also, no chance I screw up your precious package.json. 

## TODO

*   Make registry distribution more user friendly. 
