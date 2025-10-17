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
// Referencias a elementos del DOM
let elementos = {};

// ============================================================================
// INICIALIZACIÓN
// ============================================================================

document.addEventListener('DOMContentLoaded', function() {
    console.log('[App] Aplicación iniciada');
    
    // Inicializar lógica de negocio
    logicaNegocio = new LogicaDeNegocio();
    
    // Obtener referencias a elementos del DOM
    inicializarElementos();
    
    // Configurar event listeners
    configurarEventListeners();
    
    // Cargar primera medición
    actualizarMedicion();
    
    // Iniciar actualización automática
    iniciarActualizacionAutomatica();
});

// ============================================================================
// CONFIGURACIÓN INICIAL
// ============================================================================

function inicializarElementos() {
    elementos = {
        // Estado
        estadoConexion: document.getElementById('estado-conexion'),
        estadoTexto: document.getElementById('estado-texto'),
        
        // Datos de medición
        medicionContainer: document.getElementById('medicion-container'),
        tipoValor: document.getElementById('tipo-valor'),
        medicionValor: document.getElementById('medicion-valor'),
        dispositivoValor: document.getElementById('dispositivo-valor'),
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

function configurarEventListeners() {
    // Botón de actualización manual
    elementos.btnActualizar.addEventListener('click', function() {
        console.log('[App] Actualización manual solicitada');
        actualizarMedicion();
    });
    
    console.log('[App] Event listeners configurados');
}

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

async function actualizarMedicion() {
    console.log('[App] Actualizando medición...');
    
    // Deshabilitar botón temporalmente
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
            // Mostrar error
            mostrarError(resultado.error);
            mostrarEstadoConexion('Error al obtener datos', 'error');
        }
        
    } catch (error) {
        console.error('[App] Error inesperado al actualizar:', error);
        mostrarError('Error inesperado al actualizar datos');
        mostrarEstadoConexion('Error', 'error');
    } finally {
        // Rehabilitar botón
        elementos.btnActualizar.disabled = false;
        elementos.btnActualizar.textContent = 'Actualizar Ahora';
        
        // Actualizar hora de última actualización
        actualizarHoraActualizacion();
    }
}

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
    
    // Cambiar color del valor según el tipo
    if (medicion.tipoRaw === 'temperatura') {
        elementos.medicionValor.style.color = '#e74c3c'; // Rojo para temperatura
    } else if (medicion.tipoRaw === 'gas') {
        elementos.medicionValor.style.color = '#2980b9'; // Azul para gas
    }
}

function mostrarError(mensajeError) {
    console.error('[App] Mostrando error en interfaz:', mensajeError);
    
    // Ocultar contenedor de medición y sin datos
    elementos.medicionContainer.style.display = 'none';
    elementos.sinDatos.style.display = 'none';
    
    // Mostrar mensaje de error
    elementos.errorMensaje.style.display = 'block';
    elementos.errorTexto.textContent = mensajeError;
}

function mostrarSinDatos() {
    console.log('[App] Mostrando mensaje de sin datos');
    
    // Ocultar contenedor de medición y error
    elementos.medicionContainer.style.display = 'none';
    elementos.errorMensaje.style.display = 'none';
    
    // Mostrar mensaje de sin datos
    elementos.sinDatos.style.display = 'block';
}

function actualizarHoraActualizacion() {
    const ahora = new Date();
    const horaFormateada = ahora.toLocaleTimeString('es-ES');
    elementos.ultimaActualizacion.textContent = `Última actualización: ${horaFormateada}`;
}

// ============================================================================
// ACTUALIZACIÓN AUTOMÁTICA
// ============================================================================

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

window.addEventListener('beforeunload', function() {
    console.log('[App] Limpiando recursos antes de cerrar...');
    detenerActualizacionAutomatica();
});