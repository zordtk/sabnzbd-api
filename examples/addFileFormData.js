const sabnzbd   = require("../dist");
const FormData  = require("form-data");
const fs        = require("fs");

try {
    var client      = new sabnzbd.Client("host", "apiKey");
    var formData    = new FormData();

    formData.append("nzbfile", fs.createReadStream("/path/to/file"));
    client.addFile(formData).then(results => {
        console.log(results);
    }).catch(error => {
        console.log("Error: " + error.message);
    });
} catch( error ) {
    console.log("Error: " + error.message);
}