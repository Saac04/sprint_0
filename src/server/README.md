# Backend Biometria - Documentación del Servidor

Este proyecto corresponde al **servidor backend** de una aplicación IoT para la gestión de mediciones ambientales (temperatura y gas). El backend está desarrollado en **Node.js** usando **Express** y una base de datos **MySQL**. Está preparado para ser desplegado en un entorno **Plesk**.

---

## Estructura de Archivos

- `api.js`: Punto de entrada principal del servidor Express y definición de rutas REST.
- `database.js`: Módulo de conexión y gestión de la base de datos MySQL.
- `LogicaDeNegocio.js`: Lógica de negocio para validación y procesamiento de mediciones.
- `env`: Archivo de variables de entorno (no debe compartirse públicamente).

---

## Instalación y Configuración

1. **Clonar el repositorio** en el servidor Plesk.
2. **Instalar dependencias**:
    ```bash
    npm install
    ```
3. **Configurar variables de entorno**:  
    Crea un archivo `.env` (o usa el proporcionado) con los siguientes datos:

    ```env
    NODE_ENV=production
    DB_HOST=localhost
    DB_USER=usuario_mysql
    DB_PASSWORD=contraseña_segura
    DB_NAME=nombre_base_datos
    DB_PORT=3306
    PORT=3000
    FRONTEND_URL=https://tudominio/front
    ```

    > ⚠️ **Importante:** No compartas ni subas a repositorios públicos el archivo `.env` ni credenciales de base de datos.

4. **Configura la base de datos** en Plesk y asegúrate de que la tabla `mediciones` existe.

---

## Endpoints Disponibles

- **GET `/api/health`**  
  Verifica el estado del servidor.

- **POST `/api/medicion`**  
  Guarda una nueva medición.  
  **Body:**  
  ```json
  {
     "tipo": "temperatura" | "gas",
     "valor": number
  }
  ```

- **GET `/api/medicion`**  
  Obtiene la última medición registrada.

---

## Seguridad y Consideraciones

- **No expongas el archivo `.env`** ni los datos de acceso a la base de datos.
- El servidor está preparado para aceptar peticiones solo desde el frontend configurado en `FRONTEND_URL`.
- Si usas Plesk, asegúrate de que los puertos y permisos estén correctamente configurados.

---

## Despliegue en Plesk

1. Sube el proyecto al espacio web.
2. Configura Node.js en Plesk apuntando a `api.js` como archivo principal.
3. Define las variables de entorno desde el panel de Plesk o mediante el archivo `.env`.
4. Asegúrate de que el puerto configurado en `PORT` esté permitido.

---

## Notas

- Los logs se imprimen en consola y pueden ser redirigidos según la configuración de Plesk.
- Si necesitas más endpoints o lógica, consulta los archivos fuente.
- Este código es parte del sprint 0 del proyecto.
- Para más detalles sobre el funcionamiento de cada módulo, revisa los archivos `.h` correspondientes.

## Créditos

Desarrollado por Santiago Aguirre y colaboradores.

---