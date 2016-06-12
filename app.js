// Open Bank Project

// Copyright 2011,2014 TESOBE / Music Pictures Ltd.
//
// Usuario a) Actor principal, ejecuta los casos de uso
//
//
// Usuario b) Cuenta de exchange, TODO: Modificar  

//  email: alberto.garcia.gutierrez.x.x@example.com",
//  account_id: 31b3a179-eadb-4c3e-8f6d-3ada84d4ba15
//	password: f37a72
//
//
//

var express = require('express');
var session = require('express-session')
var util = require('util');
var oauth = require('oauth');
var bodyParser= require('body-parser');
var crypto_balance=0;
var http = require('http');
var fs = require('fs');
var index2 = fs.readFileSync('front/user2.html');


var app = express();
app.set('views', __dirname + '/front');
app.engine('html', require('ejs').renderFile);
app.set('view engine', 'ejs');

// To get the values for the following fields, please register your client here:
// https://apisandbox.openbankproject.com/consumer-registration
var _openbankConsumerKey = "5otsgo1lj1yry3f0zxbiu0gevhhigakgfvcw3wcl";
var _openbankConsumerSecret = "ph0az44esbxt3ooxy1o2exrxk5ghcpxfn2frzrs0";
var base_url = "https://apisandbox.openbankproject.com";

var consumer = new oauth.OAuth(
  base_url + '/oauth/initiate',
  base_url + '/oauth/token',
  _openbankConsumerKey,
  _openbankConsumerSecret,
  '1.0',                             //rfc oauth 1.0, includes 1.0a
  'http://127.0.0.1:8080/callback',
  'HMAC-SHA1');

var cookieParser = require('cookie-parser');
app.use(session({
  secret: "very secret",
  resave: false,
  saveUninitialized: true
}));

var api_base_url;


app.get('/connect', function(req, res){
  consumer.getOAuthRequestToken(function(error, oauthToken, oauthTokenSecret, results){
    if (error) {
      res.status(500).send("Error getting OAuth request token : " + util.inspect(error));
    } else {
      req.session.oauthRequestToken = oauthToken;
      req.session.oauthRequestTokenSecret = oauthTokenSecret;
      res.redirect(base_url + "/oauth/authorize?oauth_token="+req.session.oauthRequestToken);
    }
  });
});



app.get('/callback', function(req, res){
  consumer.getOAuthAccessToken(
    req.session.oauthRequestToken,
    req.session.oauthRequestTokenSecret,
    req.query.oauth_verifier,
    function(error, oauthAccessToken, oauthAccessTokenSecret, result) {
      if (error) { 	
        //oauthAccessToken, -Secret and result are now undefined
        res.status(500).send("Error getting OAuth access token : " + util.inspect(error));
      } else {
        //error is now undefined
        req.session.oauthAccessToken = oauthAccessToken;
        req.session.oauthAccessTokenSecret = oauthAccessTokenSecret;
        res.redirect('/signed_in');
      }
    }
  );
});


app.get('/signed_in', function(req, res){
  res.status(200).send('Signing in by OAuth worked.' 
 + 	'Acciones disponibles: <br><a href="/getAllTransactions">'
 +'Ver listado de transacciones</a>  <br>'
 +'<a href="/getBalance">Ver balance</a> <br>'
 +'<a href="/makeTransaction"> Hacer Transacción </a>')
});


app.get('/getAllTransactions', function(req, res){
  
  consumer.get("https://apisandbox.openbankproject.com/obp/v1.2.1/banks/at03-bank-x/accounts/9da72b02-5a6e-45e8-8cfe-daa23412ebb5/owner/transactions",
  req.session.oauthAccessToken,
  req.session.oauthAccessTokenSecret,
  function (error, data, response) {

      var parsedData = JSON.parse(data);
      res.status(200).send(parsedData);
      //res.write(data);
  });
});

app.get('/getBalance', function(req, res){
  
  consumer.get("https://apisandbox.openbankproject.com/obp/v1.2.1/banks/at03-bank-x/accounts/9da72b02-5a6e-45e8-8cfe-daa23412ebb5/owner/transactions",
  req.session.oauthAccessToken,
  req.session.oauthAccessTokenSecret,
  function (error, data, response) {

      var parsedData = JSON.parse(data);
      var balance_json= get_balance(parsedData);	
      res.status(200).send(balance_json);
      //res.write(data);
  });
});



app.get('/makeTransaction', function(req, res){
  

  // exports.OAuth.prototype.post= function(url, oauth_token, oauth_token_secret, post_body, post_content_type, callback) {
  var post_params = {};
  post_params.bank_id= 'at03-bank-x';
  post_params.account_id= '31b3a179-eadb-4c3e-8f6d-3ada84d4ba15';
  post_params.amount='12.45';

  console.log(post_params);



  consumer.post("https://apisandbox.openbankproject.com/obp/v1.2.1/banks/at03-bank-x/accounts/9da72b02-5a6e-45e8-8cfe-daa23412ebb5/owner/transactions",
  req.session.oauthAccessToken,
  req.session.oauthAccessTokenSecret,
  JSON.stringify(post_params),
  'application/json',						
  function (error, data, response) {

      //var parsedData = JSON.parse(data);
      //res.write(data);
      //var balance_json= get_balance(parsedData);	
      crypto_balance += 9.85* 12.45;
      res.status(200).send(data);
      //res.write(data);
  });
});


app.get('/accounts', function(req, res){
  consumer.get("https://apisandbox.openbankproject.com/obp/v1.2.1/getBanks",
  req.session.oauthAccessToken,
  req.session.oauthAccessTokenSecret,
  function (error, data, response) {
      


      //var parsedData = JSON.parse(data);
      //res.status(200).send(data)
      //res.write(data);
  });
});




app.get('/getBanks', function(req, res){
  consumer.get("https://apisandbox.openbankproject.com/obp/v1.2.1/banks",
  req.session.oauthAccessToken,
  req.session.oauthAccessTokenSecret,
  function (error, data, response) {
      var parsedData = JSON.parse(data);
      res.status(200).send(parsedData)
  });
});



app.get('/user', function(req, res){ 
      res.render('user2.html');  
});



app.get('*', function(req, res){
  res.redirect('/connect');
});




function get_balance(transactions_log){

	total_balances= {} 
	fiat_balance=transactions_log.transactions[0].details.new_balance;
	total_balances.fiat_balance=fiat_balance;
	total_balances.crypto_balance= {}
	total_balances.crypto_balance.eth=crypto_balance;
	

	return total_balances;
}

function get_transactions_log(transactions_log){


}




app.listen(8080);

