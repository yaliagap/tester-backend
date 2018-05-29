const Promise = require('promise');
const bcrypt = require('bcrypt');
const crypto = require('crypto');
const vm = require('../middleware/ValidationMiddleware');

module.exports = class Bot {
	constructor(db){
		this.db = db;
		this.table = 'cognitivetester.bots';
	}
	validarBot(bot) {
		return new Promise(function(resolve, reject) {
			var promises = [];
			console.log("validando Bot");
			promises.push(vm.validarLongitud(bot.nombre, 0, 30, 'El nombre debe tener una logitud de máximo 30 caracteres.'));
			promises.push(vm.validarLongitud(bot.usuario, 0, 60, 'El usuario debe tener una logitud de máximo 60 caracteres.'));
			promises.push(vm.validarLongitud(bot.password, 0, 15, 'El password tener una logitud de máximo 15 caracteres.'));
			promises.push(vm.validarLongitud(bot.variable, 0, 30, 'La variable debe tener una logitud de máximo 30 caracteres.'));
			promises.push(vm.validarLongitud(bot.workspace_id, 0, 60, 'El workspace ID debe tener una logitud de máximo 60 caracteres.'));
			Promise.all(promises).then(function(answer) {
				resolve(true);
			}).catch(function(error){
				reject({error: error});
			});
		});
	}
	save(nombre, username, password, workspace_id, variable){
		var slf = this;
		return new Promise(function(resolve, reject){
			slf.db.insert(slf.table,{
				'nombre': nombre,
				'usuario':username,
				'password':password,
				'variable': variable,
				'workspace_id': workspace_id
			},'id').then(function(val){
				resolve(val);
			}).catch(function(err){
				reject({error: "Error en base de datos. Por favor vuelva a intentarlo."});
			});
		});
	}
	update(id, nombre, username, password, workspace_id, variable){
		var slf = this;
		return new Promise(function(resolve, reject){
			slf.db.update(slf.table,{
				'nombre': nombre,
				'usuario':username,
				'password':password,
				'variable': variable,
				'workspace_id': workspace_id
			},['id','=',id]).then(function(val){
				resolve(val);
			}).catch(function(err){
				reject({error: "Error en base de datos. Por favor vuelva a intentarlo."});
			});
		});
	}
	get(params){
		var slf = this;
		return new Promise(function(resolve, reject){
			slf.db.get(slf.table,['id', 'nombre', 'usuario','password', 'workspace_id', 'variable'],params,{sort:['id','asc']}).then(function(values){
				if (values && values.length > 0) {
					resolve(values);
				} else {
					reject({"error": "No se encontraron registros."});
				}
			}).catch(function(err){
				reject({error: "Error en base de datos. Por favor vuelva a intentarlo."});
			});
		});
	}
	delete(id){
		var slf = this;
		return new Promise(function(resolve, reject){
			slf.db.delete(slf.table,["id", "=", id]).then(function(values){
				resolve(values)
			}).catch(function(err){
				reject({error: "Error en base de datos. Por favor vuelva a intentarlo."});
			});
		});
	}
}