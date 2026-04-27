module.exports = {
  ci: {
    collect: {
      numberOfRuns: 3,
      startServerCommand:
        'cd backend && NABERI_ADDR=127.0.0.1:4010 NABERI_WEB_DIR=../web/dist go run ./cmd/server',
      startServerReadyPattern: 'Naberi backend listening on',
      startServerReadyTimeout: 30000,
      url: [
        'http://127.0.0.1:4010/',
        'http://127.0.0.1:4010/admin/event-types',
      ],
      settings: {
        chromeFlags: '--no-sandbox',
        preset: 'desktop',
      },
    },
    upload: {
      target: 'filesystem',
      outputDir: './lighthouse-report',
      reportFilenamePattern:
        '%%HOSTNAME%%-%%PATHNAME%%-%%DATETIME%%.report.%%EXTENSION%%',
    },
  },
};
