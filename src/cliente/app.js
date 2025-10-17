// ============================================================================
// app.js
// Aplicación principal del frontend
// Maneja la interfaz de usuario y actualización de datos
// ============================================================================

// Instancia global de la lógica de negocio
let logicaNegocio;

// Intervalo de actualización automática
let intervaloActualizacion;
const INTERVALO_ACTUALIZACION = 20000; // 20 segundos

// Referencias a elementos del DOM (se inicializan más adelante)
let elementos = {};

// ============================================================================
// INICIALIZACIÓN
// ============================================================================

document.addEventListener('DOMContentLoaded', function() {
    console.log('[App] Aplicación iniciada');
    
    // Inicializar lógica de negocio (clase que gestiona la obtención y validación de datos)
    logicaNegocio = new LogicaDeNegocio();
    
    // Obtener referencias a elementos del DOM para manipular la interfaz
    inicializarElementos();
    
    // Configurar event listeners (por ejemplo, para el botón de actualizar)
    configurarEventListeners();
    
    // Cargar la primera medición al iniciar la app
    actualizarMedicion();
    
    // Iniciar actualización automática cada INTERVALO_ACTUALIZACION ms
    iniciarActualizacionAutomatica();
});

// ============================================================================
// CONFIGURACIÓN INICIAL
// ============================================================================

/**
 * Obtiene y almacena referencias a los elementos del DOM que se usarán en la app.
 */
function inicializarElementos() {
    elementos = {
        // Estado de conexión
        estadoConexion: document.getElementById('estado-conexion'),
        estadoTexto: document.getElementById('estado-texto'),
        
        // Datos de medición
        medicionContainer: document.getElementById('medicion-container'),
        tipoValor: document.getElementById('tipo-valor'),
        medicionValor: document.getElementById('medicion-valor'),
        dispositivoValor: document.getElementById('dispositivo-valor'), // (no se usa en la UI actual)
        timestampValor: document.getElementById('timestamp-valor'),
        
        // Mensajes
        sinDatos: document.getElementById('sin-datos'),
        errorMensaje: document.getElementById('error-mensaje'),
        errorTexto: document.getElementById('error-texto'),
        
        // Controles
        btnActualizar: document.getElementById('btn-actualizar'),
        ultimaActualizacion: document.getElementById('ultima-actualizacion')
    };
    
    console.log('[App] Elementos del DOM inicializados');
}

/**
 * Configura los event listeners de la interfaz.
 * Actualmente solo el botón de actualización manual.
 */
function configurarEventListeners() {
    // Botón de actualización manual
    elementos.btnActualizar.addEventListener('click', function() {
        console.log('[App] Actualización manual solicitada');
        actualizarMedicion();
    });
    
    console.log('[App] Event listeners configurados');
}

/**
 * Cambia el mensaje y el color del estado de conexión en la interfaz.
 * @param {string} mensaje - Texto a mostrar.
 * @param {string} estado - Puede ser 'conectado' o 'error'.
 */
function mostrarEstadoConexion(mensaje, estado) {
    elementos.estadoTexto.textContent = mensaje;
    
    // Remover clases previas
    elementos.estadoConexion.classList.remove('conectado', 'error');
    
    // Agregar clase según estado
    if (estado === 'conectado') {
        elementos.estadoConexion.classList.add('conectado');
    } else if (estado === 'error') {
        elementos.estadoConexion.classList.add('error');
    }
}

// ============================================================================
// ACTUALIZACIÓN DE MEDICIONES
// ============================================================================

/**
 * Consulta la última medición al backend y actualiza la interfaz.
 * Maneja estados de carga, error y éxito.
 */
async function actualizarMedicion() {
    console.log('[App] Actualizando medición...');
    
    // Deshabilitar botón temporalmente para evitar múltiples clicks
    elementos.btnActualizar.disabled = true;
    elementos.btnActualizar.textContent = 'Actualizando...';
    
    try {
        // Obtener medición mediante lógica de negocio
        const resultado = await logicaNegocio.getMedicion();
        
        if (resultado.success) {
            // Mostrar medición en la interfaz
            mostrarMedicion(resultado.medicion);
            mostrarEstadoConexion('Conectado', 'conectado');
        } else {
            // Mostrar error recibido desde la lógica de negocio
            mostrarError(resultado.error);
            mostrarEstadoConexion('Error al obtener datos', 'error');
        }
        
    } catch (error) {
        // Captura errores inesperados (por ejemplo, problemas de red)
        console.error('[App] Error inesperado al actualizar:', error);
        mostrarError('Error inesperado al actualizar datos');
        mostrarEstadoConexion('Error', 'error');
    } finally {
        // Rehabilitar botón y restaurar texto
        elementos.btnActualizar.disabled = false;
        elementos.btnActualizar.textContent = 'Actualizar Ahora';
        
        // Actualizar hora de última actualización (siempre, aunque haya error)
        actualizarHoraActualizacion();
    }
}

/**
 * Muestra los datos de la medición en la interfaz.
 * @param {object} medicion - Objeto con los datos formateados de la medición.
 */
function mostrarMedicion(medicion) {
    console.log('[App] Mostrando medición en interfaz:', medicion);
    
    // Ocultar mensajes de error o sin datos
    elementos.sinDatos.style.display = 'none';
    elementos.errorMensaje.style.display = 'none';
    
    // Mostrar contenedor de medición
    elementos.medicionContainer.style.display = 'block';
    
    // Actualizar valores en el DOM
    elementos.tipoValor.textContent = medicion.tipo;
    elementos.medicionValor.textContent = medicion.valor;
    elementos.timestampValor.textContent = medicion.timestamp;
    
    // Cambiar color del valor según el tipo de medición
    if (medicion.tipoRaw === 'temperatura') {
        elementos.medicionValor.style.color = '#e74c3c'; // Rojo para temperatura
    } else if (medicion.tipoRaw === 'gas') {
        elementos.medicionValor.style.color = '#2980b9'; // Azul para gas
    }
}

/**
 * Muestra un mensaje de error en la interfaz.
 * @param {string} mensajeError - Texto del error a mostrar.
 */
function mostrarError(mensajeError) {
    console.error('[App] Mostrando error en interfaz:', mensajeError);
    
    // Ocultar contenedor de medición y mensaje de sin datos
    elementos.medicionContainer.style.display = 'none';
    elementos.sinDatos.style.display = 'none';
    
    // Mostrar mensaje de error
    elementos.errorMensaje.style.display = 'block';
    elementos.errorTexto.textContent = mensajeError;
}

/**
 * Muestra el mensaje de "sin datos" en la interfaz.
 * (Actualmente no se usa, pero está preparado para futuras ampliaciones)
 */
function mostrarSinDatos() {
    console.log('[App] Mostrando mensaje de sin datos');
    
    // Ocultar contenedor de medición y error
    elementos.medicionContainer.style.display = 'none';
    elementos.errorMensaje.style.display = 'none';
    
    // Mostrar mensaje de sin datos
    elementos.sinDatos.style.display = 'block';
}

/**
 * Actualiza el texto con la hora de la última actualización exitosa.
 */
function actualizarHoraActualizacion() {
    const ahora = new Date();
    const horaFormateada = ahora.toLocaleTimeString('es-ES');
    elementos.ultimaActualizacion.textContent = `Última actualización: ${horaFormateada}`;
}

// ============================================================================
// ACTUALIZACIÓN AUTOMÁTICA
// ============================================================================

/**
 * Inicia el intervalo de actualización automática de la medición.
 */
function iniciarActualizacionAutomatica() {
    console.log(`[App] Iniciando actualización automática cada ${INTERVALO_ACTUALIZACION / 1000} segundos`);
    
    // Limpiar intervalo previo si existe
    if (intervaloActualizacion) {
        clearInterval(intervaloActualizacion);
    }
    
    // Crear nuevo intervalo
    intervaloActualizacion = setInterval(() => {
        console.log('[App] Actualización automática ejecutándose...');
        actualizarMedicion();
    }, INTERVALO_ACTUALIZACION);
}

/**
 * Detiene el intervalo de actualización automática.
 */
function detenerActualizacionAutomatica() {
    console.log('[App] Deteniendo actualización automática');
    
    if (intervaloActualizacion) {
        clearInterval(intervaloActualizacion);
        intervaloActualizacion = null;
    }
}

// ============================================================================
// LIMPIEZA AL CERRAR
// ============================================================================

/**
 * Antes de cerrar la ventana/pestaña, detiene la actualización automática para liberar recursos.
 */
window.addEventListener('beforeunload', function() {
    console.log('[App] Limpiando recursos antes de cerrar...');
    detenerActualizacionAutomatica();
});