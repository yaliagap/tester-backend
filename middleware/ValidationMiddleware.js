module.exports = {
	validarExiste : function(valor, mensaje) {
		return new Promise(function(resolve, reject) {
			if (!valor) {
				return reject(mensaje);
			} else {
				return resolve();
			}
		});
	},
	validarFecha : function(fecha, mensaje) {
		return new Promise(function(resolve, reject) {
			var fechaD = new Date(fecha);
			if ( Object.prototype.toString.call(fechaD) === "[object Date]" ) {
				if ( isNaN( fechaD.getTime() ) ) {  
					return reject(mensaje);
				} else {
					return resolve();
				}
			} else {
				return reject(mensaje);
			}		
		});	
	},
	validarNumerico : function(numero, min, max, mensaje){
		return new Promise(function(resolve, reject) {
			if (isNaN(numero)) {
		    	return reject(mensaje);
			} else {
				if (numero > 99 || numero < 0 ) {
					return reject(mensaje);
				} else {
					return resolve();
				}
			}
		});	
	},
	validarLongitud : function(valor, min, max, mensaje){
		return new Promise(function(resolve, reject) {
			if (valor.length >= min && valor.length <= max) {
				return resolve();
			} else {
				return reject(mensaje);
			}
		});	
	},
	validarContiene : function(valor, lista, mensaje) {
		return new Promise(function(resolve, reject) {
			if (!(lista.indexOf(valor) >= 0)) {
				return reject(mensaje);
			} else {
				return resolve();
			}
		});	
	},
	validarIguales(val1, val2, mensaje) {
		return new Promise(function(resolve, reject) {
			if (!(val1 === val2)) {
				return reject(mensaje);
			} else {
				return resolve();
			}
		});	
	}
}