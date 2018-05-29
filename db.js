/*
Full CRUD support enabled. 
Returns promises to external users of this class but internally handles itself by Async calls.
*/


//Dependencies
var pg = require('pg');
var Promise = require('promise');

//Environment variables for Cloud Foundry.
var env = JSON.parse(process.env.VCAP_SERVICES);
var pgUri = env['elephantsql'][0]['credentials']['uri'] 


//Exportable module. Needs to be more configurable based on the database being used.
function DB(){

	this.pool = new pg.Pool({connectionString: pgUri, max: 1});
	// console.log("NEW POOOL");

}


//Creation of pool client - implementation requirement for PostgreSQL. Your mileage may vary.
DB.prototype.make_client = function(){
	var conn = this;
	return new Promise(function(resolve, reject){
		//console.log('Client Created');
		conn.pool.connect().then(function(client){
			return resolve(client);
		}).catch(function(err){
			return reject(err)
		})
	})
}


//Executes the query and releases the created back to the pool.
DB.prototype.query = function(client, sql, parameters=null,callback){
	var conn = this;

	//Debug of SQL statements
	console.log(sql)
	console.log(parameters);

	if (!parameters){
		client.query(sql,function(err,data){
			if (err){
				console.log(err.stack);
				client.release();
				callback(null);
			} else {
				client.release();
				callback(data.rows);
			}
		})
	} else{
		client.query(sql,parameters,function(err,data){
			if (err){
				console.log(err.stack);
				client.release();
				callback(null)
			} else {
				client.release();
				callback(data.rows);
			}
		});
	}
}


//Generates the where statement and adjusts the binding of parameters if parameters have been bound by other functions
DB.prototype.where = function(client, sql, where=null,callback,param_counter=1,prior_params=null,options=null){

	var conn = this;
	if (!where){
		sql += conn.options(options) + ';';
		conn.query(client,sql,null,callback);
	} else {
		if (param_counter > 1){
			var params = prior_params;
		} else {
			var params = [];
		}
		sql += ' WHERE ';
		if( Math.floor(where.length/4) >= 1 ){
			//This where statement has an AND or OR connector in there.
			var y = 0;
			var field;
			var operator;
			var connector;
			for (var i = 0; i <= Math.floor(where.length/4); i++){
				field = where[y++];
				operator = where[y++];
				if (operator == 'IN' || operator == 'NOT IN'){
					sql += field + ' ' + operator + ' (';
					for (var j = 0; j < where[y].length; j++){
						if ((j+1) == where[y].length){
							sql += '$'+(param_counter) + ')';
						} else {
							sql += '$'+(param_counter) + ','; 
						}
						param_counter++;
						params.push(where[y][j]);
					}
					y++;
				} else {
					params.push(where[y++]);
					sql += field + ' ' + operator + ' ' + '$'+param_counter;
					param_counter++;
				}
				if (y < where.length-1){
					connector = where[y++];
					sql += ' '+connector+' ';
				}
			}
		} else {
			/*
				Where statement has no logic connector (AND / OR) but may
				still contain IN or NOT IN selectors. 
			*/
			if (where[1] == 'IN' || where[1] == 'NOT IN'){
				sql += where[0] + ' ' + where[1] + '(';
				for(var i = 0; i < where[2].length; i++){
					if ((i+1) == where[2].length){
						sql += '$'+(param_counter++) + ')';
					} else {
						sql += '$'+(param_counter++) + ','; 
					}
					params.push(where[2][i]);
				}
			} else {
				sql += where[0] + ' ' + where[1] + ' $'+param_counter;
				params.push(where[2]);
			}
		}
		sql += conn.options(options) + ';';
		conn.query(client,sql,params,callback);
	}
}


DB.prototype.options = function(options){
	//Single sort function;
	var option_text = '';
	if (options == null){
		return option_text;
	}
	if (options.group != null){
		option_text += 'GROUP BY ';
		for (var i = 0; i < options.group.length; i++){
			if (i == options.group.length-1){
				option_text += options.group[i];
			} else {
				option_text += options.group[i]+',';
			}
		}
	}
	if (options.sort != null){
		option_text += ' ORDER BY '+options.sort[0]+' '+options.sort[1];
	}
	if (options.limit != null){
		option_text += ' LIMIT '+options.limit;
	}
	return option_text;
}

//SELECT statement generator
DB.prototype.get = function(table,fields=null, where=null,options=null){
	var conn = this;
	return new Promise(function(resolve, reject){
		conn.make_client().then(function(client){
			var text = '';
			if (!fields){
				text += 'SELECT * FROM '+table;
			} else {
				text += 'SELECT '+fields.join()+' FROM '+table;
			}
			conn.where(client, text, where,resolve,1,null,options);
		}).catch(function(err){
			reject(err);
		})
	})
}


//INSERT INTO statement generator.
DB.prototype.insert = function(table,values, id='id'){
	var conn = this;
	return new Promise(function(resolve,reject){
		conn.make_client().then(function(client){
			var columns = Object.keys(values);
			var sql = 'INSERT INTO '+table+'('+columns.join()+') VALUES (';
			var params = [];
			for(var i = 0; i < columns.length; i++){
				if ((i+1) == columns.length){
					sql += '$'+(i+1) + ')';
				} else {
					sql += '$'+(i+1) + ','; 
				}
				params.push(values[columns[i]]);
			}
			conn.query(client,sql+= ' RETURNING ' + id, params, resolve);
		})
	})
}


/*
	Bulk INSERT statement handler. 
	The values parameter is an object whose property names represent the columns 
	and the value for each property should be an array with all the values
	to insert.
*/
DB.prototype.bulkInsert = function(table, values,id='id'){
	var conn = this;
	return new Promise(function(resolve, reject){
		conn.make_client().then(function(client){
			var columns = Object.keys(values);
			var col_length = columns.length;
			var sql = 'INSERT INTO '+table+'('+columns.join()+') VALUES ';
			var params = [];
			for (var i = 0; i < values[columns[0]].length;i++){
				sql += '('
				for (var j = 0; j < col_length; j++){
					params.push(values[columns[j]][i]);
					if ( j == col_length -1){
						sql += '$'+(col_length*i+(j+1));
					} else {
						sql += '$'+(col_length*i+(j+1))+',';
					}
				}
				sql += ')'
				if (i < values[columns[0]].length - 1){
					sql += ',';
				}
			}
			conn.query(client,sql+= ' RETURNING ' + id, params, resolve);
		})
	})
}

//DELETE statement, requires a where statement that is not blank so that individual queries can never delete the entire table
DB.prototype.delete = function(table,where){
	var conn = this;
	return new Promise(function(resolve,reject){
		if (where == null || where.length < 3){
			return reject({message:'Remote table truncation is disallowed'})
		}
		conn.make_client().then(function(client){
			var sql = 'DELETE FROM '+table;
			conn.where(client,sql,where,resolve);
		}).catch(function(err){
			reject(err);
		})
	})
}


//UPDATE statement.
DB.prototype.update = function(table, settables, where){
	var conn = this;
	return new Promise(function(resolve,reject){
		conn.make_client().then(function(client){
			var sql = 'UPDATE '+table+' SET ';
			var settable_columns = Object.keys(settables);
			var param_counter = 1;
			var params = [];
			for (var i = 0; i < settable_columns.length; i++){
				if ((i+1) == settable_columns.length){
					sql += settable_columns[i] + '= $'+param_counter;
				} else {
					sql += settable_columns[i] + '= $'+param_counter+',';
				}
				params.push(settables[settable_columns[i]]);
				param_counter++;
			}
			conn.where(client,sql,where,resolve,param_counter,params);
		}).catch(function(err){
			reject(err);
		})
	})
}



module.exports = DB;

