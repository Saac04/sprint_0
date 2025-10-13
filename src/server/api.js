const express = require('express');
const cors = require('cors');
const dotenv = require('dotenv');
const { LogicaDeNegocio } = require('./LogicaDeNegocio');
require('./logger'); // FUNCION PARA USAR UN LOG LOCAL PORQUE NO SE EN DONDE SE GUARDA LOS CONSOLE.LOG DE NORMAL

// Configurar variables de entorno
dotenv.config();

// Crear instancia de Express
const app = express();
const PORT = process.env.PORT || 3000;

// Crear instancia de LogicaDeNegocio
const logicaNegocio = new LogicaDeNegocio();

// ================================
// MIDDLEWARE
// ================================

// debido a que el front y el backend estan / estaran en dominios diferentes
// se usa CORS para permitir esas conexiones
app.use(cors({
    origin: process.env.FRONTEND_URL || '*',
    methods: ['GET', 'POST', 'PUT', 'DELETE'],
    credentials: true
}));

// se hace parse de JSON para recibir datos en el body
app.use(express.json({ limit: '5mb' }));

// y tambien en la URL encoded data
app.use(express.urlencoded({ extended: true }));

// Middleware para logging de requests
app.use((req, res, next) => {
    const timestamp = new Date().toISOString();
    console.log(`[${timestamp}] ${req.method} ${req.url} - IP: ${req.ip}`);
    next();
});

// ================================
// RUTAS DE LA API REST
// ================================

// Con este endpoint se puede verificar que el servidor está corriendo
// y obtener un mensaje simple de estado, no se si cuenta como Test automatico, pero sirve para monitoreo
app.get('/api/health', (req, res) => {
    res.status(200).json({
        success: true,
        message: 'API IoT funcionando correctamente',
        timestamp: new Date().toISOString()
    });
});

// ================================
// POST /api/mediciones
// Guardar nueva medición desde Android
// Recibe: { tipo: "temperatura" | "gas", valor: number }
// ================================
app.post('/api/mediciones', async (req, res) => {
	
	console.log('Headers recibidos:', req.headers);
    console.log('Body recibido:', req.body);
    console.log('Body es objeto?', typeof req.body);
    console.log('Body tiene tipo?', req.body?.tipo);
    try {
        // Validar que lleguen datos en el body
        if (!req.body) {
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
			//console.log( 'El campo "tipo" es requerido')
            return res.status(400).json({
                success: false,
                error: 'El campo "tipo" es requerido'
            });
        }

        if (datosMedicion.valor === undefined || datosMedicion.valor === null) {
			console.log('El campo "valor" es requerido')
            return res.status(400).json({
                success: false,
                error: 'El campo "valor" es requerido'
            });
        }

        // Validar que tipo sea "temperatura" o "gas", porque la logica de negocio solo acepta esos dos tipos
        const tiposValidos = ['temperatura', 'gas'];
        if (!tiposValidos.includes(datosMedicion.tipo.toLowerCase())) {
			console.log( `El tipo debe ser "temperatura" o "gas". Recibido: "${datosMedicion.tipo}"`)
            return res.status(400).json({
                success: false,
                error: `El tipo debe ser "temperatura" o "gas". Recibido: "${datosMedicion.tipo}"`
            });
        }

        const resultado = await logicaNegocio.guardarMedicion(datosMedicion);
		

        // Si todo va bien responder con éxito
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
        console.error('Error en POST /api/mediciones:', error);		
        
        // Manejar diferentes tipos de errores
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
// GET /api/mediciones
// Obtener la última medición registrada
// ================================
app.get('/api/mediciones', async (req, res) => {
    try {
        console.log('Obteniendo última medición');

        // Llamar a la lógica de negocio para obtener la última medición
        const ultimaMedicion = await logicaNegocio.getMedicion();

        // Verificar si hay mediciones
        if (!ultimaMedicion || ultimaMedicion.length === 0) {
            return res.status(404).json({
                success: false,
                error: 'No se encontraron mediciones en el sistema'
            });
        }

        // Respuesta exitosa con la última medición
        res.status(200).json({
            success: true,
            data: ultimaMedicion[0]
        });

    } catch (error) {
        console.error('Error en GET /api/mediciones:', error);
        
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
// ================================
app.use('*', (req, res) => {
    res.status(404).json({
        success: false,
        error: `Ruta no encontrada: ${req.method} ${req.originalUrl}`,
        rutas_disponibles: [
            'GET  /api/health',
            'POST /api/mediciones (body: {tipo: "temperatura|gas", valor: number})', 
            'GET  /api/mediciones (retorna la última medición)',
        ]
    });
});

// ================================
// MIDDLEWARE DE MANEJO DE ERRORES GLOBAL
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

//Originalmente la inicialización del servidor era mas sencilla, pero despues de varios errores iniciales
//lo pasé por chatGPT, logró arrelgar el error, y ademas dejo los console.log y me gústo como quedó asi que lo dejo asi

async function iniciarServidor() {
    try {
        // Verificar conexión a base de datos antes de iniciar
        console.log('Verificando conexión a base de datos...');
        await logicaNegocio.verificarConexion();
        console.log('Conexión a base de datos exitosa');
        
        // Iniciar servidor
        app.listen(PORT, () => {
            console.log(`\n ============================================`);
            console.log(`   Servidor IoT iniciado exitosamente`);
            console.log(`============================================`);
            console.log(` Puerto: ${PORT}`);
            console.log(` URL Local: http://localhost:${PORT}`);
            console.log(` Health Check: http://localhost:${PORT}/api/health`);
            console.log(`\n Endpoints Disponibles:`);
            console.log(`   POST /api/mediciones`);
            console.log(`        Body: {tipo: "temperatura|gas", valor: number}`);
            console.log(`   GET  /api/mediciones`);
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

// Manejar cierre graceful del servidor
process.on('SIGTERM', () => {
    console.log('\n Cerrando servidor graciosamente...');
    process.exit(0);
});

process.on('SIGINT', () => {
    console.log('\n Servidor interrumpido por usuario...');
    process.exit(0);
});

// Inicializar servidor
iniciarServidor();

// Exportar app para testing
module.exports = app;