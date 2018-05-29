const Promise = require('promise');
const utils = require('../utils');
const multipart = require('connect-multiparty');
const multipartMiddleware = multipart();
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
	router.get('/bots/:id', [ multipartMiddleware], function(req,res,next){
		if (req.params.id) {
			Bot.get(['id', '=', req.params.id]).then(function(data) {
				res.json(data[0]);
			}).catch(function(err){
				res.json(err);
			});
		} else {
			res.json({"error": "Se requiere id para obtener el bot."});
		}
	});
	router.post('/bots/save', [authCheckSession, multipartMiddleware], function(req,res,next){
		var bot = {};
		if (req.body.workspace_id && req.body.username && req.body.password && req.body.nombre && req.body.variable) {
			bot.workspace_id = req.body.workspace_id;
			bot.usuario = req.body.username;
			bot.password = req.body.password;
			bot.nombre = req.body.nombre;
			bot.variable = req.body.variable;
			Bot.validarBot(bot).then(function() {
				utils.firstRequest(bot).then(function() {
					Bot.save(bot.nombre, bot.usuario, bot.password, bot.workspace_id, bot.variable).then(function(data) {
						res.json(data);
					}).catch(function(err){
						res.json(err);
					});
				}).catch(function(err) {
					res.json(err);
				});
			}).catch(function(err) {
				res.json(err);
			});
		} else {
			res.json({"error": "Por favor llenar todos los campos."});
		}
	});
	router.post('/bots/:id', [authCheckSession, multipartMiddleware], function(req,res,next){
		var bot = {};
		if (req.params.id, req.body.workspace_id && req.body.username && req.body.password && req.body.nombre && req.body.variable) {
			bot.id = req.params.id;
			bot.workspace_id = req.body.workspace_id;
			bot.usuario = req.body.username;
			bot.password = req.body.password;
			bot.nombre = req.body.nombre;
			bot.variable = req.body.variable;
			console.log("ENTEEERED");
			Bot.validarBot(bot).then(function() {
				utils.firstRequest(bot).then(function() {
					Bot.update(bot.id, bot.nombre, bot.usuario, bot.password, bot.workspace_id, bot.variable).then(function(data) {
						res.json({});
					}).catch(function(err){
						res.json(err);
					});
				}).catch(function(err) {
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
						if (!bot.variable) {
							bot.variable = "case";
						}
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