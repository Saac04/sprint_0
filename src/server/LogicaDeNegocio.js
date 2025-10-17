const { Database } = require('./database');
require('./logger'); // FUNCION PARA USAR UN LOG LOCAL PORQUE NO SE EN DONDE SE GUARDA LOS CONSOLE.LOG DE NORMAL


class LogicaDeNegocio {
    constructor() {
        this.database = new Database();
    }

    // ================================
    // MÉTODO 1: guardarMedicion
    // Recibe datos del Android y los guarda en BD
    // ================================
    async guardarMedicion(datos) {
        try {
            console.log('Iniciando guardado de medición:', datos);

            // Validar estructura básica de datos
            this.validarDatosEntrada(datos);

            // Validar tipo específico
            this.validarTipoMedicion(datos.tipo);

            // Validar valor numérico
            this.validarValorMedicion(datos.valor);

            // Preparar datos para insertar en BD
            const datosParaDB = this.prepararDatosParaDB(datos);

            // Insertar en base de datos
            const resultado = await this.database.ejecutarQuery(
                `INSERT INTO mediciones (dispositivo_id, tipo, valor, fecha) 
                 VALUES (?, ?, ?, ?)`,
                [
                    datosParaDB.dispositivo_id,
                    datosParaDB.tipo,
                    datosParaDB.valor,
                    datosParaDB.timestamp
                ]
            );

            console.log('Medición guardada exitosamente - ID:', resultado.insertId);

            // Retornar confirmación
            return {
                id: resultado.insertId,
                dispositivo_id: datosParaDB.dispositivo_id,
                tipo: datosParaDB.tipo,
                valor: datosParaDB.valor,
                timestamp: datosParaDB.timestamp
            };

        } catch (error) {
            console.error('Error en guardarMedicion:', error);
            throw error;
        }
    }

    // ================================
    // MÉTODO 2: getMediciones
    // Obtiene la ultima medicion
    // ================================
    async getMedicion() {
        try {
            console.log('Consultando ultima medcion');

            // Query optimizada para mediciones recientes
            const query = `
                SELECT id, dispositivo_id, tipo, valor, fecha 
                FROM mediciones 
                ORDER BY fecha DESC 
                LIMIT 1
            `;

            const mediciones = await this.database.ejecutarQuery(query);

            // Si no hay mediciones, retornar null
            if (!mediciones || mediciones.length === 0) {
                return null;
            }

            // Retornar SOLO la primera medición formateada (no un array)
            return this.formatearMedicion(mediciones[0]);

        } catch (error) {
            console.error(' Error en getMedicion:', error);
            throw new Error('Error al consultar medicion: ' + error.message);
        }
    }

    // ================================
    // MÉTODOS DE VALIDACIÓN
    // ================================

    validarDatosEntrada(datos) {
        if (!datos || typeof datos !== 'object') {
            throw new Error('Los datos de la medición son requeridos');
        }

        if (!datos.tipo) {
            throw new Error('El tipo de medición es requerido');
        }

        if (datos.valor === undefined || datos.valor === null) {
            throw new Error('El valor de la medición es requerido');
        }
    }

    validarTipoMedicion(tipo) {
        const tiposValidos = ['temperatura', 'gas'];
        
        if (!tiposValidos.includes(tipo.toLowerCase().trim())) {
            throw new Error(`Tipo de medición inválido. Debe ser: ${tiposValidos.join(' o ')}`);
        }
    }

    validarValorMedicion(valor) {
        // Convertir a número si es string
        const valorNumerico = Number(valor);
        
        if (isNaN(valorNumerico)) {
            throw new Error('El valor de la medición debe ser numérico');
        }

        // Validaciones básicas de rango (muy amplias para versión inicial)
        if (valorNumerico < -1000 || valorNumerico > 10000) {
            throw new Error('El valor está fuera del rango permitido (-1000 a 10000)');
        }

        return valorNumerico;
    }

    // ================================
    // MÉTODOS DE PROCESAMIENTO
    // ================================

    prepararDatosParaDB(datos) {
        return {
            dispositivo_id: datos.dispositivo_id || 'default_device', // Aun no guardo el id de dispositivo por ende siempre sera default_device
            tipo: datos.tipo.toLowerCase().trim(),
            valor: this.validarValorMedicion(datos.valor),
            timestamp: datos.timestamp || new Date().toISOString()
        };
    }

    construirQueryConFiltros(filtros) {
        let query = 'SELECT id, dispositivo_id, tipo, valor, fecha FROM mediciones';
        let condiciones = [];
        let params = [];

        // Filtro por dispositivo
        if (filtros.dispositivo_id) {
            condiciones.push('dispositivo_id = ?');
            params.push(filtros.dispositivo_id);
        }

        // Filtro por tipo de medición
        if (filtros.tipo) {
            if (['temperatura', 'gas'].includes(filtros.tipo)) {
                condiciones.push('tipo = ?');
                params.push(filtros.tipo);
            }
        }

        // Filtro por rango de fechas
        if (filtros.fecha_inicio) {
            condiciones.push('fecha >= ?');
            params.push(filtros.fecha_inicio);
        }

        if (filtros.fecha_fin) {
            condiciones.push('fecha <= ?');
            params.push(filtros.fecha_fin);
        }

        // Agregar condiciones WHERE si existen
        if (condiciones.length > 0) {
            query += ' WHERE ' + condiciones.join(' AND ');
        }

        // Ordenar por fecha descendente
        query += ' ORDER BY fecha DESC';

        // Agregar límite si se especifica
        if (filtros.limite) {
            const limite = parseInt(filtros.limite);
            if (limite > 0 && limite <= 1000) {
                query += ' LIMIT ?';
                params.push(limite);
            }
        }

        return { query, params };
    }

    formatearMedicion(medicion) {
        return {
            id: medicion.id,
            dispositivo_id: medicion.dispositivo_id,
            tipo: medicion.tipo,
            valor: parseFloat(medicion.valor), // Asegurar que sea número
            timestamp: medicion.timestamp
        };
    }

    // ================================
    // MÉTODO AUXILIAR PARA VERIFICACIÓN
    // ================================

    async verificarConexion() {
        try {
            console.log(' Verificando conexión a base de datos...');
            
            // Test simple de conexión
            await this.database.ejecutarQuery('SELECT 1 as test');
            
            console.log(' Conexión a base de datos verificada exitosamente');
            return true;
            
        } catch (error) {
            console.error(' Error de conexión a base de datos:', error);
            throw new Error('No se puede conectar a la base de datos: ' + error.message);
        }
    }

}

module.exports = { LogicaDeNegocio };