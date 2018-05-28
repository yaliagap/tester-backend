const Promise = require('promise');
const bcrypt = require('bcrypt');
const crypto = require('crypto');

module.exports = class Bot {
	constructor(db){
		this.db = db;
		this.table = 'cognitivetester.bots';
	}
	save(nombre, username, password, workspace_id){
		var slf = this;
		return new Promise(function(resolve, reject){
			slf.db.insert(slf.table,{
				'nombre': nombre,
				'usuario':username,
				'password':password,
				'workspace_id': workspace_id
			},'id').then(function(val){
				resolve(val);
			}).catch(function(err){
				reject(err);
			})
		})
	}
	get(params){
		var slf = this;
		return new Promise(function(resolve, reject){
			slf.db.get(slf.table,['id', 'nombre', 'usuario','password', 'workspace_id'],params,{sort:['id','asc']}).then(function(values){
				resolve(values)
			}).catch(function(err){
				reject(err);
			})
		})
	}
	delete(id){
		var slf = this;
		return new Promise(function(resolve, reject){
			slf.db.delete(slf.table,["id", "=", id]).then(function(values){
				resolve(values)
			}).catch(function(err){
				reject(err);
			})
		})
	}
}