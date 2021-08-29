# SABnzbd-API
[SABnzbd](http://sabnzbd.org/) API client written in TypeScript licensed under the MIT. It supports most of the API calls listed in the version 3.1.1 documentation (https://sabnzbd.org/wiki/advanced/api). It's still under active development and will soon support the remaining functions.

[![GitHub license](https://img.shields.io/badge/license-MIT-blue.svg)](https://github.com/zordtk/sabnzbd-api/blob/main/LICENSE)  [![npm version](https://img.shields.io/npm/v/sabnzbd-api.svg?style=flat)](https://www.npmjs.com/package/sabnzbd-api) [![CircleCI](https://circleci.com/gh/zordtk/sabnzbd-api.svg?style=shield)](https://circleci.com/gh/zordtk/sabnzbd-api)

# Features
* Written in TypeScript
* Promise based API
* Supports adding files via multi-part form data using the [FormData](https://github.com/form-data/form-data) library.

# Dependencies
* TypeScript
* Got v11.8.2+ (https://github.com/sindresorhus/got)
* FormData v4.0+ (https://github.com/form-data/form-data)

# Installation
```npm install --save sabnzbd-api```

# Documentation
You can find the API documentation at https://zordtk.github.io/sabnzbd-api/docs/, you should also read SABnzbd's API documentation at https://sabnzbd.org/wiki/advanced/api

# Usage
#### version()
```javascript
const SABnzbd = require("sabnzbd-api");
let client    = new SABnzbd.Client("http://example.com/sabnzbd", "apikey");
client.version().then(version => {
    console.log(version);
}).catch(error => {
    console.log(error.message);
});
```

#### addUrl()
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

#### addFile()
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
* Status functions (added in SABnzbd v3.4.0, currently in development)
* Status information (added in SABnzbd v3.4.0, currently in development)
* Orphaned Jobs
* Examples
* Test browser compatibility
