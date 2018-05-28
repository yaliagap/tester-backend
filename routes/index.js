var Promise = require('promise');
var utils = require('../utils');

var multipart = require('connect-multiparty');
var multipartMiddleware = multipart();
const sql = require('../db.js');
const SQL_CONN = new sql();
const UsuarioModel = require('../models/Usuario.js');
const Usuario = new UsuarioModel(SQL_CONN);
const BotModel = require('../models/Bot.js');
const Bot = new BotModel(SQL_CONN);


module.exports = function(authCheckSession, authClearSession) {
	var express = require('express');
	var router = express.Router();

	router.post('/authenticate', multipartMiddleware, function(req,res,next) {
		Usuario.login(req.body.username, req.body.password).then(function(login_info){
			req.session.username=req.body.username;
			req.session.save();
			login_info.token = req.session.id;
			res.json(login_info);
		}).catch(function(err){
			res.json(err);
		});
	});
	router.post('/logout', authClearSession);
	router.get('/bots', [authCheckSession, multipartMiddleware], function(req,res,next){
		Bot.get().then(function(data) {
			res.json(data);
		}).catch(function(err){
			res.json(err);
		});
	});
	router.post('/bots/save', [authCheckSession, multipartMiddleware], function(req,res,next){
		var bot = {};
		if (req.body.workspace_id && req.body.username && req.body.password && req.body.nombre) {
			bot.workspace_id = req.body.workspace_id;
			bot.usuario = req.body.username;
			bot.password = req.body.password;
			bot.nombre = req.body.nombre;
			utils.firstRequest(bot).then(function() {
				Bot.save(bot.nombre, bot.usuario, bot.password, bot.workspace_id).then(function(data) {
					res.json(data);
				}).catch(function(err){
					res.json(err);
				});
			}).catch(function(err) {
				res.json(err);
			});
		} else {
			res.json({"error": "Por favor llenar todos los campos."});
		}
	});
	router.post('/bots/delete', [authCheckSession, multipartMiddleware], function(req,res,next){
		Bot.delete(req.body.id).then(function(data) {
			res.json(data);
		}).catch(function(err){
			res.json(err);
		});
	});
	router.post('/resultsjson', [authCheckSession, multipartMiddleware], function(req,res,next) {
		var results = {};
		var conversations = [];
		if (req.body.bot) {
			if (req.files.testcsv) {
				utils.generateCSV(req.files.testcsv).then(function(test) {
					Bot.get(["id", "=", req.body.bot]).then(function(data) {
						var bot = data[0];
						bot.variable = "case";
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
							utils.getStatistics(results).then(function(processedResults) {
								res.json({
									"results": {
										"list": processedResults.list, 
										"percentage": processedResults.percentage,
										"percentagePerClass": {
											"classes": processedResults.classes,
											"correct": processedResults.correct,
											"incorrect": processedResults.incorrect
										}
									}
								});
							});
						});
					}).catch(function(err){
						console.log(err);
						res.json(err);
					});
				}).catch(function(err){
					console.log(err);
					res.json(err);
				});
			} else {
				res.json({"results": {},"error": "Ingresa un archivo"});
			}
		} else {
			res.json({"results": results, "error": "Selecciona un asistente"});
		}
	});

	return router;
}