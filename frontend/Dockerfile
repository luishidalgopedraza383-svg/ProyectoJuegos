FROM node:20-alpine AS build
WORKDIR /app
COPY package.json package-lock.json ./
RUN npm ci --no-audit --no-fund
COPY . .

# URL de la API vista desde el navegador (máquina que abre la página).
ARG VITE_API_BASE_URL=http://localhost:4000/api/v1
ARG VITE_SHOW_DEMO_ACCOUNTS=false
ENV VITE_API_BASE_URL=${VITE_API_BASE_URL} \
    VITE_SHOW_DEMO_ACCOUNTS=${VITE_SHOW_DEMO_ACCOUNTS}

RUN npm run build

FROM nginx:1.27-alpine
# La imagen oficial de nginx aplica envsubst a las plantillas de /etc/nginx/templates.
ENV API_ORIGIN=http://localhost:4000
COPY --from=build /app/dist /usr/share/nginx/html
COPY nginx.conf.template /etc/nginx/templates/default.conf.template
EXPOSE 80
HEALTHCHECK --interval=15s --timeout=5s --retries=5 \
  CMD wget -q -O /dev/null http://localhost/health || exit 1
