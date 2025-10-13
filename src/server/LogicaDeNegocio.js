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
            console.log('🔄 Iniciando guardado de medición:', datos);

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

            console.log('✅ Medición guardada exitosamente - ID:', resultado.insertId);

            // Retornar confirmación
            return {
                id: resultado.insertId,
                dispositivo_id: datosParaDB.dispositivo_id,
                tipo: datosParaDB.tipo,
                valor: datosParaDB.valor,
                timestamp: datosParaDB.timestamp
            };

        } catch (error) {
            console.error('❌ Error en guardarMedicion:', error);
            throw error;
        }
    }

    // ================================
    // MÉTODO 2: getMediciones
    // Obtiene mediciones con filtros opcionales
    // ================================
    async getMediciones(filtros = {}) {
        try {
            console.log('🔍 Consultando mediciones con filtros:', filtros);

            // Construir query SQL dinámico
            const { query, params } = this.construirQueryConFiltros(filtros);

            // Ejecutar consulta
            const mediciones = await this.database.ejecutarQuery(query, params);

            console.log(`✅ Encontradas ${mediciones.length} mediciones`);

            // Formatear respuesta
            return mediciones.map(medicion => this.formatearMedicion(medicion));

        } catch (error) {
            console.error('❌ Error en getMediciones:', error);
            throw new Error('Error al consultar mediciones: ' + error.message);
        }
    }

    // ================================
    // MÉTODO 3: getMedicionesRecientes
    // Obtiene las últimas N mediciones para tiempo real
    // ================================
    async getMedicionesRecientes(limite = 50) {
        try {
            console.log(`📊 Consultando ${limite} mediciones más recientes`);

            // Validar límite
            if (!Number.isInteger(limite) || limite < 1 || limite > 1000) {
                throw new Error('El límite debe ser un número entero entre 1 y 1000');
            }

            // Query optimizada para mediciones recientes
            const query = `
                SELECT id, dispositivo_id, tipo, valor, fecha 
                FROM mediciones 
                ORDER BY fecha DESC 
                LIMIT ?
            `;

            // Ejecutar consulta
            const medicionesRecientes = await this.database.ejecutarQuery(query, [limite]);

            console.log(`✅ Obtenidas ${medicionesRecientes.length} mediciones recientes`);

            // Formatear y retornar
            return medicionesRecientes.map(medicion => this.formatearMedicion(medicion));

        } catch (error) {
            console.error('❌ Error en getMedicionesRecientes:', error);
            throw new Error('Error al consultar mediciones recientes: ' + error.message);
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
            console.log('🔄 Verificando conexión a base de datos...');
            
            // Test simple de conexión
            await this.database.ejecutarQuery('SELECT 1 as test');
            
            console.log('✅ Conexión a base de datos verificada exitosamente');
            return true;
            
        } catch (error) {
            console.error('❌ Error de conexión a base de datos:', error);
            throw new Error('No se puede conectar a la base de datos: ' + error.message);
        }
    }

    // ================================
    // MÉTODOS DE ESTADÍSTICAS BÁSICAS (BONUS)
    // ================================

    async obtenerEstadisticas() {
        try {
            const stats = await this.database.ejecutarQuery(`
                SELECT 
                    COUNT(*) as total_mediciones,
                    COUNT(DISTINCT dispositivo_id) as total_dispositivos,
                    AVG(CASE WHEN tipo = 'temperatura' THEN valor END) as temp_promedio,
                    AVG(CASE WHEN tipo = 'gas' THEN valor END) as gas_promedio,
                    MAX(fecha) as ultima_medicion
                FROM mediciones
            `);

            return {
                total_mediciones: stats[0].total_mediciones,
                total_dispositivos: stats[0].total_dispositivos,
                temperatura_promedio: stats[0].temp_promedio ? parseFloat(stats[0].temp_promedio.toFixed(2)) : null,
                gas_promedio: stats[0].gas_promedio ? parseFloat(stats[0].gas_promedio.toFixed(2)) : null,
                ultima_medicion: stats[0].ultima_medicion
            };

        } catch (error) {
            console.error('❌ Error al obtener estadísticas:', error);
            throw new Error('Error al calcular estadísticas: ' + error.message);
        }
    }

    // ================================
    // MÉTODO PARA LIMPIAR DATOS ANTIGUOS (MANTENIMIENTO)
    // ================================

    async limpiarDatosAntiguos(diasAntiguedad = 30) {
        try {
            const fechaLimite = new Date();
            fechaLimite.setDate(fechaLimite.getDate() - diasAntiguedad);

            const resultado = await this.database.ejecutarQuery(
                'DELETE FROM mediciones WHERE fecha < ?',
                [fechaLimite.toISOString()]
            );

            console.log(`🧹 Eliminadas ${resultado.affectedRows} mediciones anteriores a ${diasAntiguedad} días`);
            
            return {
                eliminadas: resultado.affectedRows,
                fecha_limite: fechaLimite.toISOString()
            };

        } catch (error) {
            console.error('❌ Error al limpiar datos antiguos:', error);
            throw new Error('Error en limpieza de datos: ' + error.message);
        }
    }
}

module.exports = { LogicaDeNegocio };