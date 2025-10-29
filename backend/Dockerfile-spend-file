# ==========================
# Stage 1: Build backend (TypeScript)
# ==========================
 FROM node:18-alpine AS build
 WORKDIR /app

# Cài thêm bash và coreutils để tránh lỗi Permission / find / cp
 RUN apk add --no-cache bash coreutils

Copy package.json & package-lock.json để cài dependencies
 COPY package*.json ./

# Cài tất cả dependencies (bao gồm devDependencies để build TS)
 RUN npm install

# Copy toàn bộ mã nguồn
 COPY . .

# Build TypeScript ra dist
 RUN chmod +x ./node_modules/.bin/tsc
 RUN npx --no-install tsc

# Copy public files (Zalo verification, uploads...) sang dist
 RUN cp -r public dist/public

# ==========================
# Stage 2: Run backend (production)
# ==========================
FROM node:18-alpine
WORKDIR /app

# Copy package.json (production deps)
COPY --from=build /app/package*.json ./

# Copy dist sang image
COPY --from=build /app/dist ./dist

# Copy public sang image
COPY --from=build /app/public ./public

# Cài only production dependencies
RUN npm install --omit=dev

# Expose port backend
EXPOSE 5000

# Chạy server
CMD ["node", "dist/server.js"]
