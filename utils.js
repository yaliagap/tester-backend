const Baby = require('papaparse');
const fs = require('fs');
const request = require('request');
function generateOptions(bot, u_message, context) {
	var ctx = {};
	if (context.length > 0) {
		ctx = context[0];
	}	
	var url = "https://gateway.watsonplatform.net/conversation/api/v1/workspaces/" + bot.workspace_id + "/message?version=2018-02-16";
	var auth = "Basic " + new Buffer(bot.usuario + ":" + bot.password).toString("base64");
	return {
	    headers: {
	      'Content-Type': 'application/json',
	       "Authorization" : auth
	    },
	    uri: url,
	    json: {
	    	input: {
	    		text: u_message
	    	},
	    	context: ctx
	    },
	    method: 'POST',
	    timeout: 80000
	}
}
module.exports = {
	generateCSV: function(testCSV) {
		return new Promise(function(resolve, reject) {
		    var uploadcontent = fs.readFileSync(testCSV.path, 'utf-8');
		    var parsed = Baby.parse(uploadcontent);
		    var convId = 0;
		    var results = [];
		    if (parsed) {
		    	for (var i = 0; i < parsed.data.length; i++) {	
		    		if(parsed.data[i][1] && parsed.data[i][2]) {
		    			var obj = {
							"u": parsed.data[i][1],
							"b": parsed.data[i][2]	
						};
			    		if (convId != parsed.data[i][0]) {
			    			results.push([obj]);
			    		} else {
			    			var last = results.length-1;
			    			results[last].push(obj);
			    		}
			    		convId = parsed.data[i][0];
		    		} else {
		    			reject({"error": "Archivo no tiene los campos correctos"});
		    		}					
		    	}
		    }	
		    resolve(results);	
		});
	},
	promiseSerial: (funcs) =>
	  funcs.reduce((promise, func) =>
	    promise.then(result => func(result).then(Array.prototype.concat.bind(result)))
	    .catch(result => func(result).then(Array.prototype.concat.bind(result))),
	    Promise.resolve([])),

	firstRequest: function(bot) {
		return new Promise(function(resolve, reject) {
			var options = generateOptions(bot, "", {});
			request(options, function(req, res) {
				if (res.body && res.body.context) {
					resolve(res.body.context);
				} else {
					reject({"error": "Credenciales y/o Workspace Inválidos"});
				}
			});
		});
	},
	testRequest: function(u_message, b_message, bot, context, results) {
		return new Promise(function(resolve, reject) {
			var options = generateOptions(bot, u_message, context);
			request(options, function(req, res) {
				var conversation_id = "NULL";
				if (res && res.body.context && res.body.context.conversation_id) {
					conversation_id = res.body.context.conversation_id;
				}
				if (!results[conversation_id]) {
					results[conversation_id] = [];
				}
				if (b_message !== "start") {
					if (res && res.body.output && res.body.output[bot.variable]) {
						if (res.body.output[bot.variable] === b_message){
							results[conversation_id].push({"u": u_message, "b": res.body.output[bot.variable], "esperado": b_message, "resultado": true, "resultadoClass": "correct", "conversation_id": conversation_id });
						} else {
							results[conversation_id].push({"u": u_message, "b": res.body.output[bot.variable], "esperado": b_message, "resultado": false, "resultadoClass": "incorrect", "conversation_id": conversation_id });
						}
					} else {
						results[conversation_id].push({"u": u_message, "b": "", "esperado": b_message, "resultado": false, "resultadoClass": "incorrect", "conversation_id": conversation_id });
					}
				}
				if (res && res.body.context) {
					resolve(res.body.context);
				} else {
					resolve({});
				}
			});
		});
	},
	getStatistics(results) {
		return new Promise(function(resolve, reject) {
			var correctInd = 0.00;
			var total = 0;
			var resultsList = [];
			var resultadosClass = {};
			var classes = [];
			var correct = [];
			var incorrect = [];
			Object.keys(results).map(key =>  { 
				results[key].map((item,i) => {
					var result = {};
					total++;
					if (item.resultado) {
						correctInd +=1;
					}
					if (item.esperado in resultadosClass) {
						if (item.resultado) {
							resultadosClass[item.esperado]["correct"] += 1;
						}
						resultadosClass[item.esperado]["total"] +=  1.00;
					} else {
						if (item.resultado) {
							resultadosClass[item.esperado] = {};
							resultadosClass[item.esperado]["correct"] = 1.00;
							resultadosClass[item.esperado]["total"] = 1.00;
						} else {
							resultadosClass[item.esperado] = {};
							resultadosClass[item.esperado]["correct"] = 0.00;
							resultadosClass[item.esperado]["total"] = 1.00;
						}
					}
					result["resultadoClass"] = item.resultadoClass;
					result["conversation_id"] = item.conversation_id;
					result["u"] = item.u;
					result["b"] = item.b;
					result["esperado"] = item.esperado;
					resultsList.push(result);
				});
			});
			classes = Object.keys(resultadosClass).sort(function(a,b){return resultadosClass[b].correct/resultadosClass[b].total-resultadosClass[a].correct/resultadosClass[a].total})
			console.log(resultadosClass);
			classes.map(key =>  { 
				var correctTemp = Math.round(resultadosClass[key].correct/resultadosClass[key].total*100);
				correct.push(correctTemp);
				incorrect.push(100-correctTemp);
			});
			resolve({
				"list": resultsList, 
				"percentage": Math.round(correctInd/total*100), 
				"classes": classes,
				"correct": correct,
				"incorrect": incorrect
			});
		});
	}
}