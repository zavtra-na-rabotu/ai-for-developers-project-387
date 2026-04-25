# Browser MCP Setup

The repository uses deterministic Playwright tests for CI and supports MCP-assisted browser checks for agent-driven exploration.

## Playwright MCP

Playwright MCP provides browser automation to MCP clients through structured accessibility snapshots. Start it from the repository root:

```sh
npm run mcp:playwright
```

Equivalent MCP client configuration:

```json
{
  "mcpServers": {
    "playwright": {
      "command": "npx",
      "args": ["@playwright/mcp@latest", "--isolated", "--allowed-hosts=127.0.0.1,localhost"]
    }
  }
}
```

## Chrome DevTools MCP

Chrome DevTools MCP lets an agent inspect a live Chrome browser, including console messages, network requests, screenshots, and performance traces. Start it from the repository root:

```sh
npm run mcp:chrome-devtools
```

Equivalent MCP client configuration:

```json
{
  "mcpServers": {
    "chrome-devtools": {
      "command": "npx",
      "args": ["chrome-devtools-mcp@latest", "--isolated", "--viewport=1280x720"]
    }
  }
}
```

## Local Verification Flow

Run the app locally:

```sh
cd backend
go run ./cmd/server
```

```sh
VITE_API_BASE_URL=http://127.0.0.1:4010 npm run dev --prefix web -- --host 127.0.0.1 --port 5173
```

Then ask an MCP-enabled agent to execute the scenarios in `docs/test-scenarios.md`.
