# Aplicación Android - BLE_Santiago

Esta aplicación Android permite la comunicación y gestión de dispositivos BLE (Bluetooth Low Energy) para el proyecto de mediciones ambientales IoT. El objetivo es recibir datos de sensores (temperatura y gas) y enviarlos al backend para su almacenamiento y visualización.

## Estructura de archivos principales

- **MainActivity.java**  
  Actividad principal. Gestiona la interfaz, permisos, escaneo y conexión con dispositivos BLE.

- **Logica.java**  
  Lógica de negocio para procesar y enviar mediciones al backend.

- **PeticionarioREST.java**  
  Encapsula las peticiones HTTP REST al servidor (GET/POST).

- **TramaIBeacon.java**  
  Utilidades para el manejo y decodificación de tramas iBeacon.

- **Utilidades.java**  
  Funciones auxiliares para conversión de datos y manejo de UUIDs.

## Funcionamiento

1. **Escaneo BLE:**  
   La app solicita permisos y escanea dispositivos BLE cercanos.

2. **Recepción de datos:**  
   Al detectar un dispositivo, extrae la información relevante (tipo y valor de medición).

3. **Envío al backend:**  
   Utiliza [`PeticionarioREST.java`](ble_santiago/PeticionarioREST.java) para enviar los datos al servidor mediante una petición POST.

4. **Gestión de respuestas:**  
   Muestra en la interfaz el estado de la operación y posibles errores.

## Instalación

1. Clona el repositorio y abre el proyecto en Android Studio.
2. Conecta un dispositivo físico o usa un emulador con soporte BLE.
3. Compila y ejecuta la aplicación.

## Requisitos

- Android 7.0 (API 24) o superior.
- Permisos de Bluetooth y localización.
- Acceso a Internet para comunicación con el backend.

## Personalización

- Puedes modificar la URL del backend en [`PeticionarioREST.java`](ble_santiago/PeticionarioREST.java).
- La lógica de procesamiento de datos se encuentra en [`Logica.java`](ble_santiago/Logica.java).

## Notas

- Este código es parte del sprint 0 del proyecto.
- Para más detalles sobre el funcionamiento de cada módulo, revisa los archivos `.h` correspondientes.

## Créditos

Desarrollado por Santiago Aguirre y colaboradores.

---