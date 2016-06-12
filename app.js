// requires
var fs = require ('fs');
var prompt = require('prompt');
var erisC = require('eris-contracts');
var formidable= require ('formidable');
var http = require('http');
var util= require('util');
var crypto= require('crypto');

// Configure our HTTP server to respond with Hello World to all requests.
var server = http.createServer(function (req, res) {
    if (req.method.toLowerCase() == 'get') {
        displayForm(res);
    } else if (req.method.toLowerCase() == 'post') {
        //processAllFieldsOfTheForm(req, res);
        processFormFieldsIndividual(req, res);
    }
});

// Listen on port 8000, IP defaults to 127.0.0.1
server.listen(8000);

// Put a friendly message on the terminal
console.log("Server running at http://127.0.0.1:8000/");

// NOTE. On Windows/OSX do not use localhost. find the
// url of your chain with:
// docker-machine ls
// and find the docker machine name you are using (usually default or eris).
// for example, if the URL returned by docker-machine is tcp://192.168.99.100:2376
// then your erisdbURL should be http://192.168.99.100:1337/rpc
var erisdbURL = "http://localhost:1337/rpc";

// get the abi and deployed data squared away
var contractData = require('./epm.json');
var idisContractAddress = contractData["deployCompanies"];
var idisAbi = JSON.parse(fs.readFileSync("./abi/" + idisContractAddress));

// properly instantiate the contract objects manager using the erisdb URL
// and the account data (which is a temporary hack)
var accountData = require('./accounts.json');
var contractsManager = erisC.newContractManagerDev(erisdbURL, accountData.simplechain_full_000);

// properly instantiate the contract objects using the abi and address
var idisContract = contractsManager.newContractFactory(idisAbi).at(idisContractAddress);

// display the current value of idi's contract by calling
// the `get` function of idi's contract
function getValue(callback) {
  idisContract.get(function(error, result){
    if (error) { throw error }
    console.log("Idi's number is:\t\t\t" + result.toNumber());
    callback();
  });
}


// Handles the image upload


function processFormFieldsIndividual(req, res) {
    //Store the data from the fields in your data store.
    //The data store could be a file or database or any other store based
    //on your application.
    var fields = [];
    var form = new formidable.IncomingForm();
    //Call back when each field in the form is parsed.
    form.on('field', function (field, value) {
        console.log(field);
        console.log(value);
        fields[field] = value;
    });
    //Call back when each file in the form is parsed.
    form.on('file', function (name, file) {
        console.log(name);
        console.log(file);
        fields[name] = file;
        //Storing the files meta in fields array.
        //Depending on the application you can process it accordingly.
    });

    //Call back for file upload progress.
    form.on('fileBegin', function (name, file){
        file.path = __dirname + '/uploads/' + file.name;
    });

    form.on('file', function (name, file){
        
	console.log('Uploaded ' + file.name + getDocumentHash(file.path));
    });

    

    //Call back at the end of the form.
    form.on('end', function () {
        res.writeHead(200, {
            'content-type': 'text/plain'
        });
        res.write('received the data:\n\n');
        res.end(util.inspect({
            fields: fields
        }));
    });
    form.parse(req);
}
function displayForm(res) {
    fs.readFile('res/form.html', function (err, data) {
        res.writeHead(200, {
            'Content-Type': 'text/html',
                'Content-Length': data.length
        });
        res.write(data);
    });
}

function getDocumentHash(file_path){

  // change the algo to sha1, sha256 etc according to your requirements
  var algo = 'sha256';
  var shasum = crypto.createHash(algo);
  var file = file_path;
  var s = fs.ReadStream(file);
  s.on('data', function(d) { shasum.update(d); });
  s.on('end', function() {
  var d = shasum.digest('hex');
  console.log(d);
});

}