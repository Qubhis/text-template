FROM node:22-alpine
WORKDIR /app
COPY  .
RUN npm install && npm run build
EXPOSE 3010
VOLUME ["/app/data"]
CMD ["npm", "start"]