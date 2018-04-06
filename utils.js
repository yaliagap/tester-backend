var Baby = require('papaparse');
var fs = require('fs');
var request = require('request');
function generateOptions(bot, u_message, context) {
	var ctx = {};
	if (context.length > 0) {
		ctx = context[0];
	}	
	var url = "https://gateway.watsonplatform.net/conversation/api/v1/workspaces/" + bot.workspaceId + "/message?version=2018-02-16";
	var auth = "Basic " + new Buffer(bot.username + ":" + bot.password).toString("base64");
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
	    var uploadcontent = fs.readFileSync(testCSV.path, 'utf-8');
	    var parsed = Baby.parse(uploadcontent);
	    var convId = 0;
	    var results = [];
	    if (parsed) {
	    	for (var i = 0; i < parsed.data.length; i++) {							
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
	    	}
	    }	
	    return results;	
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
					resolve(null);
				}
			});
		});
	},
	testRequest: function(u_message, b_message, bot, context, results) {
		return new Promise(function(resolve, reject) {
			var options = generateOptions(bot, u_message, context);
			request(options, function(req, res) {
				var conversation_id = "NULL";
				if (res.body.context && res.body.context.conversation_id) {
					conversation_id = res.body.context.conversation_id;
				}
				if (!results[conversation_id]) {
					results[conversation_id] = [];
				}
				if (b_message !== "start") {
					if (res.body.output && res.body.output[bot.variable]) {
						if (res.body.output[bot.variable] === b_message){
							results[conversation_id].push({"u": u_message, "b": res.body.output[bot.variable], "esperado": b_message, "resultado": true, "resultadoClass": "correct", "conversation_id": conversation_id });
						} else {
							results[conversation_id].push({"u": u_message, "b": res.body.output[bot.variable], "esperado": b_message, "resultado": false, "resultadoClass": "incorrect", "conversation_id": conversation_id });
						}
					} else {
						results[conversation_id].push({"u": u_message, "b": "", "esperado": b_message, "resultado": false, "resultadoClass": "incorrect", "conversation_id": conversation_id });
					}
				}
				resolve(res.body.context);
			});
		});
	}
}