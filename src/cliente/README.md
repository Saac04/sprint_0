# Cliente Web - Sistema de Mediciones Biometricas

Este cliente web permite visualizar en tiempo real las mediciones biométricas (temperatura y gas) enviadas por una placa adafruit vAdafruit Feather nRF52840 Express y almacenadas en el backend.

## Estructura de archivos

- **index.html**  
  Interfaz principal del usuario. Muestra el estado de conexión, la última medición recibida, mensajes de error y controles de actualización.

- **estilo.css**  
  Estilos visuales para la interfaz web.

- **LogicaDeNegocio.js**  
  Lógica de negocio del frontend. Encapsula la obtención de mediciones desde el backend, validación y formateo de datos.

- **app.js**  
  Controlador principal de la aplicación. Gestiona la interacción con el DOM, actualizaciones automáticas, eventos y muestra de datos.

## Funcionamiento

1. **Inicio automático:**  
   Al cargar la página, se inicializa la lógica de negocio y se realiza una consulta al backend para obtener la última medición.

2. **Actualización automática:**  
   La medición se actualiza cada 20 segundos de forma automática. También se puede actualizar manualmente con el botón "Actualizar Ahora".

3. **Visualización:**  
   Se muestra el tipo de medición, valor (con unidades), fecha y hora. El color del valor cambia según el tipo (rojo para temperatura, azul para gas).

4. **Manejo de errores:**  
   Si ocurre un error al obtener los datos, se muestra un mensaje en la interfaz.

## Requisitos

- Navegador moderno compatible con ES6.
- Acceso al backend en la URL configurada (`https://sagucre.upv.edu.es/api/medicion`).

## Personalización

- Puedes modificar el intervalo de actualización automática en la constante `INTERVALO_ACTUALIZACION` de [app.js](app.js).
- Los estilos pueden ajustarse en [estilo.css](estilo.css).

## Instalación y uso

1. Coloca todos los archivos en la misma carpeta.
2. Abre [index.html](index.html) en tu navegador.
3. La aplicación se conectará automáticamente al backend y mostrará la última medición disponible.

## Estructura esperada de la medición

La medición recibida del backend debe tener la siguiente estructura:

```json
{
  "id": 1,
  "tipo": "temperatura" | "gas",
  "valor": 23.5,
  "dispositivo_id": "default_device",
  "fecha": "2024-06-01T12:34:56.000Z"
}
```

## Notas

- Este código es parte del sprint 0 del proyecto.
- Para más detalles sobre el funcionamiento de cada módulo, revisa los archivos `.h` correspondientes.

## Créditos

Desarrollado por Santiago Aguirre y colaboradores.

---