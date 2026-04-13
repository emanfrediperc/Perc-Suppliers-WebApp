FROM node:20-alpine AS builder
WORKDIR /app
COPY package*.json ./
RUN npm ci
COPY . .
RUN npx ng build --configuration production

FROM nginx:alpine
COPY --from=builder /app/dist/Perc-Suppliers-WebApp/browser /usr/share/nginx/html
COPY nginx.conf /etc/nginx/conf.d/default.conf.template
RUN chown -R nginx:nginx /var/cache/nginx /var/log/nginx /etc/nginx/conf.d /usr/share/nginx/html
RUN touch /var/run/nginx.pid && chown -R nginx:nginx /var/run/nginx.pid
USER nginx
ENV API_URL=http://api:3100
EXPOSE 80
CMD ["/bin/sh", "-c", "envsubst '${API_URL}' < /etc/nginx/conf.d/default.conf.template > /etc/nginx/conf.d/default.conf && nginx -g 'daemon off;'"]
