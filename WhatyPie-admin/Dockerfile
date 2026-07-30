FROM node:22-alpine AS deps
WORKDIR /app
COPY package*.json ./
RUN npm install

FROM node:22-alpine AS builder
WORKDIR /app
ARG NEXT_PUBLIC_API_URL=http://localhost:5000/api
ARG BACKEND_API_URL=http://localhost:5000/api
ARG NEXT_PUBLIC_API_BASE_URL=/api
ARG NEXT_PUBLIC_STORAGE_URL=http://localhost:5000/
ARG NEXT_PUBLIC_SOCKET_URL=http://localhost:5000
ARG NEXTAUTH_URL=http://localhost:3001
ARG NEXTAUTH_SECRET=build-time-placeholder
ARG NEXT_PUBLIC_WhatyPie_FRONT_URL=http://localhost:3000
ENV NEXT_PUBLIC_API_URL=$NEXT_PUBLIC_API_URL
ENV BACKEND_API_URL=$BACKEND_API_URL
ENV NEXT_PUBLIC_WhatyPie_FRONT_URL=$NEXT_PUBLIC_WhatyPie_FRONT_URL
ENV NEXT_PUBLIC_API_BASE_URL=$NEXT_PUBLIC_API_BASE_URL
ENV NEXT_PUBLIC_STORAGE_URL=$NEXT_PUBLIC_STORAGE_URL
ENV NEXT_PUBLIC_SOCKET_URL=$NEXT_PUBLIC_SOCKET_URL
ENV NEXTAUTH_URL=$NEXTAUTH_URL
ENV NEXTAUTH_SECRET=$NEXTAUTH_SECRET
COPY --from=deps /app/node_modules ./node_modules
COPY . .
# Removed from repo in TipTap migration; stale COPY layers or old releases may still ship this file.
RUN rm -f src/shared/CkEditor.tsx 2>/dev/null || true
RUN npm run build

FROM node:22-alpine AS runner
WORKDIR /app
ENV NODE_ENV=production
COPY --from=builder /app/.next ./.next
COPY --from=builder /app/node_modules ./node_modules
COPY --from=builder /app/public ./public
COPY --from=builder /app/package.json ./package.json
EXPOSE 3000
HEALTHCHECK --interval=30s --timeout=5s --start-period=30s --retries=3 CMD node -e "require('http').get('http://127.0.0.1:3000',r=>process.exit(r.statusCode<500?0:1)).on('error',()=>process.exit(1))"
CMD ["npm", "run", "start"]
