FROM node:24-alpine AS web-builder
WORKDIR /app

COPY package*.json ./
COPY web/package*.json ./web/
RUN npm ci && npm ci --prefix web

COPY tspconfig.yaml main.tsp ./
COPY web ./web
RUN npm run api:compile && VITE_API_BASE_URL= npm run build --prefix web

FROM golang:1.22-alpine AS backend-builder
WORKDIR /src

COPY backend/go.mod ./backend/
RUN cd backend && go mod download

COPY backend ./backend
RUN cd backend && CGO_ENABLED=0 GOOS=linux go build -o /out/naberi ./cmd/server

FROM alpine:3.20
WORKDIR /app

RUN addgroup -S naberi && adduser -S naberi -G naberi

COPY --from=backend-builder /out/naberi /app/naberi
COPY --from=web-builder /app/web/dist /app/web

ENV PORT=4010
ENV NABERI_WEB_DIR=/app/web

USER naberi
EXPOSE 4010
CMD ["/app/naberi"]
