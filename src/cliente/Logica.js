// ============================================================================
// LogicaDeNegocio.js (Frontend)
// Maneja la lógica de negocio del lado del cliente
// Solo contiene el método getMedicion()
// ============================================================================

class LogicaDeNegocio {
    
    constructor() {
        // Crear instancia del peticionario REST
        this.peticionario = new PeticionarioREST();
        console.log('[LogicaDeNegocio] Inicializada');
    }

    // ------------------------------------------------------------------------
    // MÉTODO: getMedicion()
    // Obtiene la última medición del backend
    // ------------------------------------------------------------------------
    async getMedicion() {
        console.log('[LogicaDeNegocio] getMedicion() - Iniciando consulta...');

        try {
            // Hacer petición al backend mediante el peticionario
            const respuesta = await this.peticionario.obtenerUltimaMedicion();

            // Verificar si la petición fue exitosa
            if (!respuesta.success) {
                console.error('[LogicaDeNegocio] Error en respuesta:', respuesta.error);
                throw new Error(respuesta.error || 'Error desconocido al obtener medición');
            }

            // Extraer los datos de la medición
            const medicion = respuesta.datos.data;

            // Validar que vengan los datos esperados
            if (!medicion) {
                throw new Error('No se recibieron datos de medición');
            }

            // Validar estructura básica
            this.validarEstructuraMedicion(medicion);

            // Formatear la medición para su uso en la UI
            const medicionFormateada = this.formatearMedicion(medicion);

            console.log('[LogicaDeNegocio] Medición obtenida y formateada:', medicionFormateada);

            return {
                success: true,
                medicion: medicionFormateada
            };

        } catch (error) {
            console.error('[LogicaDeNegocio] Error en getMedicion():', error);
            
            return {
                success: false,
                error: error.message
            };
        }
    }

    // ------------------------------------------------------------------------
    // Validar estructura de la medición recibida
    // ------------------------------------------------------------------------
    validarEstructuraMedicion(medicion) {
        const camposRequeridos = ['id', 'tipo', 'valor', 'timestamp'];
        
        for (const campo of camposRequeridos) {
            if (medicion[campo] === undefined || medicion[campo] === null) {
                throw new Error(`Falta el campo requerido: ${campo}`);
            }
        }

        // Validar que el tipo sea válido
        const tiposValidos = ['temperatura', 'gas'];
        if (!tiposValidos.includes(medicion.tipo)) {
            throw new Error(`Tipo de medición inválido: ${medicion.tipo}`);
        }

        // Validar que el valor sea numérico
        if (typeof medicion.valor !== 'number') {
            throw new Error('El valor de la medición debe ser numérico');
        }
    }

    // ------------------------------------------------------------------------
    // Formatear medición para mostrar en la interfaz
    // ------------------------------------------------------------------------
    formatearMedicion(medicion) {
        return {
            id: medicion.id,
            tipo: this.formatearTipo(medicion.tipo),
            tipoRaw: medicion.tipo,
            valor: this.formatearValor(medicion.valor, medicion.tipo),
            valorRaw: medicion.valor,
            dispositivo: medicion.dispositivo_id || 'Sin especificar',
            timestamp: this.formatearFecha(medicion.timestamp),
            timestampRaw: medicion.timestamp
        };
    }

    // ------------------------------------------------------------------------
    // Formatear el tipo de medición para mostrar
    // ------------------------------------------------------------------------
    formatearTipo(tipo) {
        const tiposFormateados = {
            'temperatura': 'Temperatura',
            'gas': 'Gas'
        };
        return tiposFormateados[tipo] || tipo;
    }

    // ------------------------------------------------------------------------
    // Formatear el valor según el tipo de medición
    // ------------------------------------------------------------------------
    formatearValor(valor, tipo) {
        // Redondear a 2 decimales
        const valorRedondeado = Math.round(valor * 100) / 100;
        
        // Agregar unidades según el tipo
        switch(tipo) {
            case 'temperatura':
                return `${valorRedondeado} °C`;
            case 'gas':
                return `${valorRedondeado} ppm`;
            default:
                return `${valorRedondeado}`;
        }
    }

    // ------------------------------------------------------------------------
    // Formatear fecha y hora para mostrar
    // ------------------------------------------------------------------------
    formatearFecha(timestamp) {
        try {
            const fecha = new Date(timestamp);
            
            // Verificar si la fecha es válida
            if (isNaN(fecha.getTime())) {
                return 'Fecha inválida';
            }

            // Formatear fecha legible en español
            const opciones = {
                year: 'numeric',
                month: '2-digit',
                day: '2-digit',
                hour: '2-digit',
                minute: '2-digit',
                second: '2-digit',
                hour12: false
            };

            return fecha.toLocaleString('es-ES', opciones);

        } catch (error) {
            console.error('[LogicaDeNegocio] Error al formatear fecha:', error);
            return 'Error en fecha';
        }
    }

    // ------------------------------------------------------------------------
    // Verificar conexión con el backend
    // ------------------------------------------------------------------------
    async verificarConexion() {
        console.log('[LogicaDeNegocio] Verificando conexión con backend...');
        
        try {
            const respuesta = await this.peticionario.verificarEstadoServidor();
            
            if (respuesta.success) {
                console.log('[LogicaDeNegocio] Conexión exitosa con backend');
                return true;
            } else {
                console.error('[LogicaDeNegocio] Error de conexión:', respuesta.error);
                return false;
            }
            
        } catch (error) {
            console.error('[LogicaDeNegocio] Error al verificar conexión:', error);
            return false;
        }
    }
}