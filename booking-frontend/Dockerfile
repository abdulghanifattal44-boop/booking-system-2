# مرحلة البناء
FROM node:22-alpine AS build

WORKDIR /app

COPY package*.json ./
RUN npm install

COPY . .

# نمرر API URL وقت الـ build
ARG VITE_API_BASE_URL=/api
ENV VITE_API_BASE_URL=${VITE_API_BASE_URL}

# Target app build: customer | admin
ARG VITE_APP_TARGET=customer
ENV VITE_APP_TARGET=${VITE_APP_TARGET}

RUN npm run build

# مرحلة التشغيل: Nginx يخدم الـ build
FROM nginx:1.27-alpine

# حذف الكونفيج الافتراضي
RUN rm /etc/nginx/conf.d/default.conf

# نسخ الكونفيج الخاص بالمشروع
COPY nginx.conf /etc/nginx/conf.d/default.conf

# نسخ ملفات الـ build
COPY --from=build /app/dist /usr/share/nginx/html

EXPOSE 80

CMD ["nginx", "-g", "daemon off;"]
