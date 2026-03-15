FROM node:20-alpine AS builder
WORKDIR /app
RUN apk add --no-cache openssl
COPY package*.json tsconfig.json ./
COPY prisma ./prisma/
RUN npm ci
RUN npx prisma generate
COPY src ./src
RUN npm run build

FROM node:20-alpine
RUN apk add --no-cache openssl
WORKDIR /app
COPY --from=builder /app/dist ./dist
COPY --from=builder /app/prisma ./prisma
COPY package*.json ./
RUN npm ci --omit=dev
RUN npx prisma generate
RUN adduser -D appuser && chown -R appuser:appuser /app
USER appuser
EXPOSE 4000
CMD ["sh", "-c", "npx prisma migrate resolve --applied 20260310025457_add_quali_session_key 2>/dev/null || true && npx prisma migrate resolve --applied 20260310035821_add_grid_user_stats 2>/dev/null || true && npx prisma migrate resolve --applied 20260311150010_add_favorite_team 2>/dev/null || true && npx prisma migrate resolve --applied 20260311190847_add_membership_status 2>/dev/null || true && npx prisma migrate deploy && node dist/index.js"]
