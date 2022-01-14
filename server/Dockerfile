FROM node:16 AS builder

WORKDIR /app
COPY ./ ./

RUN npm install
RUN npm run build

# Step 2. app
FROM node:16-alpine
WORKDIR /app
EXPOSE 8080
COPY --from=builder /app ./
CMD ["node", "dist/main"]