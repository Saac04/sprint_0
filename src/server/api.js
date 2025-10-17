const express = require('express');
const cors = require('cors');
const dotenv = require('dotenv');
const { LogicaDeNegocio } = require('./LogicaDeNegocio');
require('./logger'); // Permite registrar logs en un archivo local

// Configurar variables de entorno desde .env
dotenv.config();

// Crear instancia de Express
const app = express();
const PORT = process.env.PORT || 3000;

// Crear instancia de la lógica de negocio (gestiona la interacción con la BD)
const logicaNegocio = new LogicaDeNegocio();

let server; // Variable para almacenar el servidor, útil para cierre controlado

// ================================
// MIDDLEWARE
// ================================

// Configuración de CORS para permitir peticiones desde el frontend (dominios distintos)
app.use(cors({
    origin: process.env.FRONTEND_URL || '*',
    methods: ['GET', 'POST', 'PUT', 'DELETE'],
    credentials: true
}));

// Middleware para parsear JSON en el body de las peticiones
app.use(express.json({ limit: '5mb' }));

// Middleware para parsear datos urlencoded (formularios)
app.use(express.urlencoded({ extended: true }));

// Middleware para logging de cada request recibido
app.use((req, res, next) => {
    const timestamp = new Date().toISOString();
    console.log(`[${timestamp}] ${req.method} ${req.url} - IP: ${req.ip}`);
    next();
});

// ================================
// RUTAS DE LA API REST
// ================================

// Endpoint de salud para verificar que el servidor está corriendo correctamente
app.get('/api/health', (req, res) => {
    res.status(200).json({
        success: true,
        message: 'API IoT funcionando correctamente',
        timestamp: new Date().toISOString()
    });
});

// ================================
// POST /api/medicion
// Guarda una nueva medición enviada desde Android o cualquier cliente autorizado
// Espera en el body: { tipo: "temperatura" | "gas", valor: number }
// ================================
app.post('/api/medicion', async (req, res) => {
    try {
        // Validar que lleguen datos en el body
        if (Object.keys(req.body).length === 0) {
            return res.status(400).json({
                success: false,
                error: 'No se enviaron datos en la petición'
            });
        }

        // Extraer datos del request
        const datosMedicion = req.body;

        // Log para debugging
        console.log('Datos recibidos del Android:', JSON.stringify(datosMedicion));

        // Validación básica de campos requeridos
        if (!datosMedicion.tipo) {
            return res.status(400).json({
                success: false,
                error: 'El campo "tipo" es requerido'
            });
        }

        if (datosMedicion.valor === undefined || datosMedicion.valor === null) {
            return res.status(400).json({
                success: false,
                error: 'El campo "valor" es requerido'
            });
        }

        // Validar que tipo sea "temperatura" o "gas"
        const tiposValidos = ['temperatura', 'gas'];
        if (!tiposValidos.includes(datosMedicion.tipo.toLowerCase())) {
            return res.status(400).json({
                success: false,
                error: `El tipo debe ser "temperatura" o "gas". Recibido: "${datosMedicion.tipo}"`
            });
        }

        // Guardar la medición usando la lógica de negocio
        const resultado = await logicaNegocio.guardarMedicion(datosMedicion);

        // Si todo va bien responder con éxito y los datos guardados
        res.status(201).json({
            success: true,
            message: 'Medición guardada exitosamente',
            data: {
                id: resultado.id,
                dispositivo_id: resultado.dispositivo_id,
                tipo: resultado.tipo,
                valor: resultado.valor,
                timestamp: resultado.timestamp
            }
        });

    } catch (error) {
        console.error('Error en POST /api/medicion:', error);

        // Manejar diferentes tipos de errores y devolver el código adecuado
        if (error.message.includes('tipo') ||
            error.message.includes('valor') ||
            error.message.includes('rango') ||
            error.message.includes('numérico')) {
            return res.status(400).json({
                success: false,
                error: error.message
            });
        }

        if (error.message.includes('base de datos') ||
            error.message.includes('conexión') ||
            error.code === 'ECONNREFUSED') {
            return res.status(503).json({
                success: false,
                error: 'Error de conexión con la base de datos'
            });
        }

        // Error genérico del servidor
        res.status(500).json({
            success: false,
            error: 'Error interno del servidor',
            detalle: process.env.NODE_ENV === 'development' ? error.message : undefined
        });
    }
});

// ================================
// GET /api/medicion
// Devuelve la última medición registrada en la base de datos
// ================================
app.get('/api/medicion', async (req, res) => {
    try {
        // Obtener la última medición usando la lógica de negocio
        const ultimaMedicion = await logicaNegocio.getMedicion();

        // Verificar si hay mediciones
        if (!ultimaMedicion) {
            return res.status(404).json({
                success: false,
                error: 'No se encontraron mediciones en el sistema'
            });
        }

        // Respuesta exitosa con la última medición
        res.status(200).json({
            success: true,
            data: ultimaMedicion
        });

    } catch (error) {
        console.error('Error en GET /api/medicion:', error);

        if (error.message.includes('base de datos') ||
            error.message.includes('conexión') ||
            error.code === 'ECONNREFUSED') {
            return res.status(503).json({
                success: false,
                error: 'Error de conexión con la base de datos'
            });
        }

        res.status(500).json({
            success: false,
            error: 'Error interno del servidor',
            detalle: process.env.NODE_ENV === 'development' ? error.message : undefined
        });
    }
});

// ================================
// RUTA CATCH-ALL PARA 404
// Devuelve error si la ruta no existe
// ================================
app.use('*', (req, res) => {
    res.status(404).json({
        success: false,
        error: `Ruta no encontrada: ${req.method} ${req.originalUrl}`,
        rutas_disponibles: [
            'GET  /api/health',
            'POST /api/medicion (body: {tipo: "temperatura|gas", valor: number})',
            'GET  /api/medicion (retorna la última medición)',
        ]
    });
});

// ================================
// MIDDLEWARE DE MANEJO DE ERRORES GLOBAL
// Captura cualquier error no manejado en la aplicación
// ================================
app.use((err, req, res, next) => {
    console.error('Error no manejado:', err);

    res.status(500).json({
        success: false,
        error: 'Error interno del servidor',
        timestamp: new Date().toISOString(),
        detalle: process.env.NODE_ENV === 'development' ? err.message : undefined
    });
});

// ================================
// INICIALIZACIÓN DEL SERVIDOR
// ================================

// Inicializa el servidor solo si la conexión a la base de datos es exitosa
async function iniciarServidor() {
    try {
        // Verificar conexión a base de datos antes de iniciar
        console.log('Verificando conexión a base de datos...');
        await logicaNegocio.verificarConexion();
        console.log('Conexión a base de datos exitosa');

        // Iniciar servidor
        server = app.listen(PORT, () => {
            console.log(`\n ============================================`);
            console.log(`   Servidor IoT iniciado exitosamente`);
            console.log(`============================================`);
            console.log(` Puerto: ${PORT}`);
            console.log(` URL Local: http://localhost:${PORT}`);
            console.log(` Health Check: http://localhost:${PORT}/api/health`);
            console.log(`\n Endpoints Disponibles:`);
            console.log(`   POST /api/medicion`);
            console.log(`        Body: {tipo: "temperatura|gas", valor: number}`);
            console.log(`   GET  /api/medicion`);
            console.log(`        Retorna la última medición registrada`);
            console.log(`============================================`);
            console.log(` Servidor listo para recibir peticiones...\n`);
        });

    } catch (error) {
        console.error('\n ============================================');
        console.error('   Error al iniciar servidor');
        console.error('============================================');
        console.error('Error:', error.message);
        console.error('\n Posibles soluciones:');
        console.error('   1. Verifique la configuración en el archivo .env');
        console.error('   2. Asegúrese que MySQL esté ejecutándose');
        console.error('   3. Verifique las credenciales de base de datos');
        console.error('   4. Verifique que la tabla "mediciones" exista');
        console.error('============================================\n');
        process.exit(1);
    }
}

// ================================
// MANEJO DE CIERRE CONTROLADO DEL SERVIDOR
// Permite cerrar el servidor correctamente ante señales del sistema
// ================================
process.on('SIGTERM', () => {
    console.log('\n Cerrando servidor...');
    if (server) {
        server.close(() => {
            console.log('Conexiones cerradas');
            process.exit(0);
        });
    } else {
        process.exit(0);
    }
});
process.on('SIGINT', () => {
    console.log('\n Servidor interrumpido por usuario...');
    if (server) {
        server.close(() => {
            console.log('Conexiones cerradas');
            process.exit(0);
        });
    } else {
        process.exit(0);
    }
});

// Inicializar servidor
iniciarServidor();

// Exportar app para testing
module.exports = app;