# SABnzbd-API
SABnzbd API client written in TypeScript licensed under the MIT. It supports all of the api functions found
in the version 3.1.1 documentation (https://sabnzbd.org/wiki/advanced/api). It still lacks documentation.

[![GitHub license](https://img.shields.io/badge/license-MIT-blue.svg)](https://github.com/zordtk/sabnzbd-api/blob/main/LICENSE)  [![npm version](https://img.shields.io/npm/v/sabnzbd-api.svg?style=flat)](https://www.npmjs.com/package/sabnzbd-api) [![CircleCI](https://circleci.com/gh/zordtk/sabnzbd-api.svg?style=shield)](https://circleci.com/gh/zordtk/sabnzbd-api)

# Features
* Promise-based API
* Supports uploading of files via formdata
* Written in TypeScript

# Dependencies
* TypeScript
* Got v11.8.2+ (https://github.com/sindresorhus/got)
* FormData v4.0+ (https://github.com/form-data/form-data)

# Installation
```npm install --save sabnzbd-api```

# Usage
#### version(): Promise\<string\>
```javascript
const SABnzbd = require("sabnzbd-api");
let client    = new SABnzbd.Client("http://example.com/sabnzbd", "apikey");
client.version().then(version => {
    console.log(version);
}).catch(error => {
    console.log(error.message);
});
```

#### addUrl(url: string, name: string|undefined = undefined, password: string|undefined = undefined, cat: string|undefined = undefined, script: string|undefined = undefined, priority: Priority|undefined = undefined, postProcess: PostProcessing|undefined = undefined): Promise\<Results\>
```javascript
const SABnzbd = require("sabnzbd-api");
let client    = new SABnzbd.Client("http://example.com/sabnzbd", "apikey");
client.addUrl('url-to-nzb').then(results => {
    if( results.status )
        console.log('Added NZB');
    else
        console.log('Failed to add NZB: ' + results.error);
}).catch(error => {
    console.log(error.message);
});
```
#### addFile(formData: FormData, name: string|undefined = undefined, password: string|undefined = undefined, cat: string|undefined = undefined, script: string|undefined = undefined, priority: Priority|undefined = undefined, postProcess: PostProcessing|undefined = undefined): Promise\<Results\>
```javascript
const SABnzbd   = require("sabnzbd-api");
const fs        = require("fs");
const FormData  = require("form-data");
let client      = new SABnzbd.Client("http://example.com/sabnzbd", "apikey");
let formData    = new FormData();

formData.append("name", fs.createReadStream("/path/to/file"));
client.addUrl(formData).then(results => {
    if( results.status )
        console.log('Added NZB');
    else
        console.log('Failed to add NZB: ' + results.error);
}).catch(error => {
    console.log(error.message);
});
```

# Todo
* History functions
* Status functions
* Status information
* Orphaned Jobs
* Documentation (for now take a look at the TypeScript types and https://sabnzbd.org/wiki/advanced/api)
* Examples
