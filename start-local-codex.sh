#!/usr/bin/env bash
set -euo pipefail
project_dir="$(cd -- "$(dirname -- "${BASH_SOURCE[0]}")" && pwd)"
cd -- "$project_dir"
if ! command -v codex >/dev/null 2>&1; then
  echo 'Codex CLI is not installed or is not on PATH. See https://learn.chatgpt.com/docs/codex/cli'
  exit 1
fi
exec codex 'Read LOCAL-CODEX-HANDOFF.md and continue the native Apple Messages and Twilio integration.'
