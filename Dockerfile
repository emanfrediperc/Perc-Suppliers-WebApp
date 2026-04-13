FROM node:20-alpine AS builder
WORKDIR /app
COPY package*.json ./
RUN npm ci
COPY . .
RUN npx ng build --configuration production

FROM nginx:alpine
COPY --from=builder /app/dist/Perc-Suppliers-WebApp/browser /usr/share/nginx/html
COPY nginx.conf /etc/nginx/conf.d/default.conf.template
RUN rm -f /etc/nginx/conf.d/default.conf
ENV PORT=80
ENV API_URL=http://api:3100
CMD /bin/sh -c "envsubst '\$PORT \$API_URL' < /etc/nginx/conf.d/default.conf.template > /etc/nginx/conf.d/default.conf && exec nginx -g 'daemon off;'"
