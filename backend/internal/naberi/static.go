package naberi

import (
	"net/http"
	"os"
	"path/filepath"
	"strings"
)

func WithStaticFiles(api http.Handler, staticDir string) http.Handler {
	return staticFileHandler{
		api:       api,
		staticDir: staticDir,
	}
}

type staticFileHandler struct {
	api       http.Handler
	staticDir string
}

func (h staticFileHandler) ServeHTTP(w http.ResponseWriter, r *http.Request) {
	if r.Method == http.MethodGet || r.Method == http.MethodHead {
		if h.serveExistingFile(w, r) {
			return
		}

		if r.URL.Path == "/" || acceptsHTML(r) {
			h.serveIndex(w, r)
			return
		}
	}

	h.api.ServeHTTP(w, r)
}

func (h staticFileHandler) serveExistingFile(w http.ResponseWriter, r *http.Request) bool {
	cleanPath := strings.TrimPrefix(filepath.Clean("/"+r.URL.Path), "/")
	if cleanPath == "" {
		return false
	}

	filePath := filepath.Join(h.staticDir, cleanPath)
	info, err := os.Stat(filePath)
	if err != nil || info.IsDir() {
		return false
	}

	http.ServeFile(w, r, filePath)
	return true
}

func (h staticFileHandler) serveIndex(w http.ResponseWriter, r *http.Request) {
	indexPath := filepath.Join(h.staticDir, "index.html")
	if _, err := os.Stat(indexPath); err != nil {
		h.api.ServeHTTP(w, r)
		return
	}

	http.ServeFile(w, r, indexPath)
}

func acceptsHTML(r *http.Request) bool {
	return strings.Contains(r.Header.Get("Accept"), "text/html")
}
