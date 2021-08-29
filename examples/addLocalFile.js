const sabnzbd   = require("../dist");
const FormData  = require("form-data");
const fs        = require("fs");
var client      = new sabnzbd.Client("host", "apiKey");

client.addPath("/path/to/file").then(results => {
    console.log(results);
}).catch(error => {
    console.log("Error: " + error.message);
});