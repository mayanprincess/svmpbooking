# SvelteKit + adapter-node for Railway (or any Node host)
# Railway sets PORT; adapter-node listens on HOST (default 0.0.0.0) and PORT.

FROM node:22-alpine AS builder

WORKDIR /app

# Install dependencies first (better layer cache)
COPY package.json package-lock.json ./
RUN npm ci

COPY . .
# Ensure .svelte-kit/tsconfig.json exists (extends root tsconfig) before vite build
RUN npx svelte-kit sync && npm run build && npm prune --omit=dev

FROM node:22-alpine AS runner

WORKDIR /app

ENV NODE_ENV=production
# Bind on all interfaces (required in containers)
ENV HOST=0.0.0.0
ENV PORT=3000

# Production artifacts from adapter-node
COPY --from=builder /app/build ./build
COPY --from=builder /app/package.json ./
COPY --from=builder /app/node_modules ./node_modules

EXPOSE 3000

# adapter-node entry (see https://svelte.dev/docs/kit/adapter-node)
CMD ["node", "build/index.js"]
