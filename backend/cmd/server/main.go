package main

import (
	"log"
	"net/http"
	"os"
	"strings"
	"time"

	"naberi-backend/internal/naberi"
)

func main() {
	addr := listenAddress()

	server := naberi.NewServer(naberi.NewStore(), time.Local)
	handler := server.Routes()

	if staticDir := os.Getenv("NABERI_WEB_DIR"); staticDir != "" {
		handler = naberi.WithStaticFiles(handler, staticDir)
	}

	log.Printf("Naberi backend listening on %s", addr)
	if err := http.ListenAndServe(addr, handler); err != nil {
		log.Fatal(err)
	}
}

func listenAddress() string {
	if addr := os.Getenv("NABERI_ADDR"); addr != "" {
		return addr
	}

	port := os.Getenv("PORT")
	if port == "" {
		return ":4010"
	}

	if strings.HasPrefix(port, ":") {
		return port
	}

	return ":" + port
}
