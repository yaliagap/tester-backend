var express = require('express');
var Promise = require('promise');
var utils = require('../utils');
var router = express.Router();
var multipart = require('connect-multiparty');
var multipartMiddleware = multipart();
var bots = [
	{
		name: "Sorteo Sunat",
		username : "ec252c73-3b89-4bc2-9036-f8953a3b8448",
	    password : "HrSuwaUcjrhx",
	    workspaceId : "4fd13b5d-5290-487e-923d-f505cda95f31",
	    variable: "case"
	},
	{
		name: "Devolucion Sunat",
		username : "5f1f10e9-6632-4ddc-bbab-34ff086c86b7",
	    password : "WfkTWWQyB1xY",
	    workspaceId : "255aea96-0b52-4b1b-800e-124d1abd2047",
	    variable: "case"
	},
	{
		name: "Sharff",
		username : "b30fb32e-e849-4e42-8dea-720e6ef25c7f",
	    password : "0sjXEIwVehKN",
	    workspaceId : "8bb030e7-fba1-46db-8881-34213a3a0ebb",
	    variable: "flag"
	}
]
router.get('/', function(req, res, next) {
	res.render('index', {bots: bots});
});

router.post('/results', multipartMiddleware, function(req,res,next) {
	var results = {};
	var conversations = [];
	var test = utils.generateCSV(req.files.testcsv);
	var bot = bots[req.body.bot];
	for (var j = 0; j < test.length; j++) {
		var conversation = test[j];
		test[j].unshift({
			"u": "",
			"b": "start",
			"hidden": true
		});
		var promiseX = new Promise(function(resolve, reject) {
			var funcs = conversation.map(value => (context) => utils.testRequest(value["u"], value["b"], bot, context, results));
			utils.promiseSerial(funcs).then(function(values) {
			  	resolve(results);
			});
		});
		conversations.push(promiseX);
	}
	Promise.all(conversations).then(function(values) {
	  res.render("results", {results: results, title:"Resultados de la prueba"});
	});
	
});
module.exports = router;
