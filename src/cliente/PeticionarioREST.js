// ============================================================================
// PeticionarioREST.js
// Maneja la comunicación con el backend mediante peticiones REST (GET)
// ============================================================================

class PeticionarioREST {
    
    constructor() {
        // URL base de la API
        this.urlBase = 'https://sagucre.upv.edu.es/api';
    }

    // ------------------------------------------------------------------------
    // Método principal para hacer peticiones GET
    // ------------------------------------------------------------------------
    async hacerPeticionGET(endpoint) {
        const url = `${this.urlBase}${endpoint}`;
        
        console.log(`[PeticionarioREST] Haciendo GET a: ${url}`);

        try {
            // Realizar petición fetch
            const response = await fetch(url, {
                method: 'GET',
                headers: {
                    'Content-Type': 'application/json',
                    'Accept': 'application/json'
                }
            });

            console.log(`[PeticionarioREST] Respuesta recibida - Status: ${response.status}`);

            // Leer el cuerpo de la respuesta
            const datos = await response.json();

            // Verificar si la petición fue exitosa
            if (!response.ok) {
                throw new Error(datos.error || `Error HTTP: ${response.status}`);
            }

            console.log('[PeticionarioREST] Datos recibidos:', datos);

            return {
                success: true,
                codigo: response.status,
                datos: datos
            };

        } catch (error) {
            console.error('[PeticionarioREST] Error en petición:', error);
            
            return {
                success: false,
                codigo: 0,
                error: error.message
            };
        }
    }

    // ------------------------------------------------------------------------
    // Método específico para obtener la última medición
    // ------------------------------------------------------------------------
    async obtenerUltimaMedicion() {
        console.log('[PeticionarioREST] Obteniendo última medición...');
        return await this.hacerPeticionGET('/medicion');
    }

}