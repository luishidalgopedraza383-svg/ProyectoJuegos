#!/bin/sh
# Arranque del API: espera la base de datos, aplica migraciones, carga datos
# iniciales (roles, cuentas y catálogo) y finalmente levanta el servidor.
set -e

echo "[entrypoint] Esperando a la base de datos..."
attempt=0
until node -e "require('./src/config/database').authenticate().then(()=>process.exit(0)).catch(()=>process.exit(1))"; do
  attempt=$((attempt + 1))
  if [ "$attempt" -ge 60 ]; then
    echo "[entrypoint] No fue posible conectar con la base de datos." >&2
    exit 1
  fi
  sleep 2
done

echo "[entrypoint] Aplicando migraciones..."
npx sequelize-cli --env production db:migrate

echo "[entrypoint] Cargando datos iniciales (cuentas, roles y catálogo)..."
npx sequelize-cli --env production db:seed:all

echo "[entrypoint] Iniciando API..."
exec npm start
