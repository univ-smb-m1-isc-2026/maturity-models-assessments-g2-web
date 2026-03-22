FROM node:alpine3.23 AS builder

WORKDIR /app

COPY . .

RUN npm install

RUN npm run build:prod

FROM nginx:alpine3.23 AS runtime

COPY nginx.conf /etc/nginx/conf.d/default.conf

COPY --from=builder /app/dist/front/browser /usr/share/nginx/html
