# Changelog

All notable changes to `paybot-mcp` are documented in this file.

The format is based on [Keep a Changelog](https://keepachangelog.com/en/1.1.0/),
and this project adheres to [Semantic Versioning](https://semver.org/spec/v2.0.0.html).

## [0.3.4] - 2026-06-10

### Added

- **Startup warning for missing `PAYBOT_API_KEY`** (#58) — the server boots
  with zero environment variables by design (MCP stdio servers must complete
  the protocol handshake even when misconfigured), so a missing API key used
  to surface only as a 401 at the first tool call. The server now emits a
  one-line warning to stderr at boot (stdout stays reserved for the MCP
  protocol stream). The warning mirrors the `PAYBOT_API_KEY ?? API_KEY`
  resolution used by tool calls, never throws, and never blocks boot.

### Documentation

- **README: API-key path** (#58) — documents how to get a PayBot API key and
  wire it into the MCP server configuration.

## [0.3.3] and earlier

Previously published on npm without a changelog; see the
[release history](https://github.com/RBKunnela/paybot-mcp/releases) and git log.
