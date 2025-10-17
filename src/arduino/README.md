# Proyecto Medio Ambiente - Apartado Arduino

Este directorio contiene el código fuente Arduino para el proyecto de Medio Ambiente, específicamente `HolaMundoIBeacon`.

## Estructura

- **HolaMundoIBeacon.ino**: Archivo principal del sketch de Arduino.
- **EmisoraBLE.h**: Gestión de la emisora Bluetooth Low Energy.
- **LED.h**: Control del LED indicador.
- **Medidor.h**: Lectura de sensores o mediciones ambientales.
- **Publicador.h**: Publicación de datos a través de BLE.
- **PuertoSerie.h**: Comunicación por puerto serie.
- **ServicioEnEmisora.h**: Definición de servicios BLE.

## Descripción

El ejemplo `HolaMundoIBeacon` implementa una emisora BLE que transmite información ambiental utilizando Arduino. El código está modularizado en varias cabeceras para facilitar su mantenimiento y extensión.

## Uso

1. Abre `HolaMundoIBeacon.ino` en el IDE de Arduino.
2. Asegúrate de tener instaladas las dependencias necesarias para BLE.
3. Carga el sketch en tu placa compatible.
4. El dispositivo comenzará a emitir datos vía BLE.

## Notas

- Este código es parte del sprint 0 del proyecto.
- Para más detalles sobre el funcionamiento de cada módulo, revisa los archivos `.h` correspondientes.

## Créditos

Desarrollado por Santiago Aguirre y colaboradores.

---
