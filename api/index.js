'use strict';

// Entrada serverless de Vercel. Reemplaza a src/server.js: en Vercel no se
// llama a app.listen(), la plataforma invoca la app Express que se exporta
// aquí y gestiona el ciclo de vida de la función.
//
// El orden importa: UPLOAD_DIR se fija ANTES de cargar la app porque
// src/middlewares/upload.js crea el directorio en tiempo de carga y en Vercel
// el único directorio escribible es /tmp (las portadas subidas se pierden en
// cada despliegue; para producción real conviene un almacenamiento externo).
process.env.UPLOAD_DIR = process.env.UPLOAD_DIR || '/tmp/uploads';

const app = require('../backend/src/app');

module.exports = app;
