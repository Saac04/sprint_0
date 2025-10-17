const mysql = require('mysql2/promise');
const dotenv = require('dotenv');
require('./logger'); // Permite registrar logs en un archivo local

// Carga las variables de entorno desde el archivo .env
dotenv.config();

class Database {
    constructor() {
        // Crea un pool de conexiones a MySQL usando variables de entorno o valores por defecto
        this.pool = mysql.createPool({
            host: process.env.DB_HOST || 'localhost',
            user: process.env.DB_USER || 'root',
            password: process.env.DB_PASSWORD || '',
            database: process.env.DB_NAME || 'iotdb',
            port: process.env.DB_PORT || 3306,
            waitForConnections: true,
            connectionLimit: 10, // Máximo de conexiones simultáneas
            queueLimit: 0,       // Sin límite de peticiones en cola
            connectTimeout: 10000 // Tiempo máximo de espera para conectar (ms)
        });

        // Test inicial de conexión para verificar que la base de datos está accesible
        this.pool.getConnection()
            .then(conn => {
                console.log(' Conexión a MySQL establecida');
                conn.release(); // Libera la conexión de prueba
            })
            .catch(err => {
                console.error(' Error conectando a MySQL:', err.message);
            });
    }

    /**
     * Ejecuta un query SQL con parámetros.
     * Utiliza el pool de conexiones para mayor eficiencia.
     * @param {string} sql - Consulta SQL con placeholders (?)
     * @param {Array} params - Valores para los placeholders
     * @returns {Promise<Array|Object>} - Resultados del query (filas)
     */
    async ejecutarQuery(sql, params = []) {
        try {
            const [rows] = await this.pool.execute(sql, params);
            return rows;
        } catch (err) {
            console.error(' Error en ejecutarQuery:', err.message);
            throw err;
        }
    }

    /**
     * Cierra todas las conexiones del pool.
     * Útil para apagar el servidor de forma limpia.
     */
    async cerrarConexion() {
        try {
            await this.pool.end();
            console.log(' Conexión MySQL cerrada correctamente');
        } catch (err) {
            console.error(' Error cerrando conexión MySQL:', err.message);
        }
    }
}

module.exports = { Database };