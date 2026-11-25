'use strict';

const app = require('./app');
const { sequelize } = require('./models');
const { port, nodeEnv, requestTimeoutMs } = require('./config/env');

const start = async () => {
  try {
    await sequelize.authenticate();
    if (nodeEnv === 'development') {
      await sequelize.sync();
    }
    const server = app.listen(port, () => {
      console.log(`Proyecto Juegos API escuchando en http://localhost:${port}`);
    });
    // Corta conexiones lentas o abandonadas (útil en redes móviles y bots).
    server.requestTimeout = requestTimeoutMs;
    server.headersTimeout = requestTimeoutMs + 5000;

    const shutdown = async (signal) => {
      console.log(`${signal} recibido. Cerrando servidor...`);
      server.close(async () => {
        await sequelize.close();
        process.exit(0);
      });
    };

    process.on('SIGINT', () => shutdown('SIGINT'));
    process.on('SIGTERM', () => shutdown('SIGTERM'));
  } catch (error) {
    console.error('No fue posible iniciar Proyecto Juegos API:', error.message);
    process.exit(1);
  }
};

start();
