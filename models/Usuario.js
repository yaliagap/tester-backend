const Promise = require('promise');
const bcrypt = require('bcrypt');
const crypto = require('crypto');

module.exports = class Usuario {
	constructor(db){
		this.db = db;
		this.table = 'cognitivetester.usuarios';
	}
	login(username,password){
		var slf = this;
		return new Promise(function(resolve, reject){
			slf.db.get(slf.table,['username','password'],['username','=',username])
				.then(function(value){
					console.log("GETTING");
					console.log(value);
					if (value.length < 1){
						return reject({error:'No user found by that name'})
					}
					if (value[0].estado == 0){
						return reject({error:'Authorization for this user is revoked'});
					}
					bcrypt.compare(password, value[0].password).then(function(res){
						console.log("MATCH PASSWORD");
						if (res) {
							var returnable = {
								username:value[0].username							
							};
							return resolve(returnable);
						} else {
							return reject({error:'Unauthorized credentials'})
						}
						
					})
					.catch(function(err){
						return reject({error:'Unauthorized credentials'})
					})
				}).catch(function(err){
					return reject({error:err});
				})
		})
	}
	save(username, password){
		var slf = this;
		return new Promise(function(resolve, reject){
			bcrypt.hash(password,10).then(function(hash){
				slf.db.insert(slf.table,{
					'username':username,
					'password':hash
				},'username').then(function(val){
					resolve(val);
				}).catch(function(err){
					reject(err);
				})
			})
		})
	}
}