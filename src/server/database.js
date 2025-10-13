const mysql = require('mysql2/promise');
const dotenv = require('dotenv');
require('./logger'); // FUNCION PARA USAR UN LOG LOCAL PORQUE NO SE EN DONDE SE GUARDA LOS CONSOLE.LOG DE NORMAL


dotenv.config();

class Database {
    constructor() {
        this.pool = mysql.createPool({
            host: process.env.DB_HOST || 'localhost',
            user: process.env.DB_USER || 'root',
            password: process.env.DB_PASSWORD || '',
            database: process.env.DB_NAME || 'iotdb',
            port: process.env.DB_PORT || 3306,
            waitForConnections: true,
            connectionLimit: 10,
            queueLimit: 0,
            connectTimeout: 10000 // 10s timeout
        });

        // Test inicial de conexión
        this.pool.getConnection()
            .then(conn => {
                console.log('✅ Conexión a MySQL establecida');
                conn.release();
            })
            .catch(err => {
                console.error('❌ Error conectando a MySQL:', err.message);
            });
    }

    /**
     * Ejecuta un query SQL con parámetros
     * @param {string} sql - Query con placeholders
     * @param {Array} params - Valores para reemplazar en el query
     * @returns {Promise<Array|Object>} - Resultados del query
     */
    async ejecutarQuery(sql, params = []) {
        try {
            const [rows] = await this.pool.execute(sql, params);
            return rows;
        } catch (err) {
            console.error('❌ Error en ejecutarQuery:', err.message);
            throw err;
        }
    }

    /**
     * Inicia una transacción manual
     * @returns {Promise<Connection>}
     */
    async iniciarTransaccion() {
        const conn = await this.pool.getConnection();
        await conn.beginTransaction();
        return conn;
    }

    /**
     * Cierra todas las conexiones del pool
     */
    async cerrarConexion() {
        try {
            await this.pool.end();
            console.log('🔒 Conexión MySQL cerrada correctamente');
        } catch (err) {
            console.error('❌ Error cerrando conexión MySQL:', err.message);
        }
    }
}

module.exports = { Database };