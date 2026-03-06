#!/bin/bash
set -e

curl -fsSL https://github.com/MarceloDJunior/generate-docs/archive/refs/heads/main.tar.gz \
  | tar -xz --strip-components=1 generate-docs-main/.claude

echo "Done. Open Claude Code in this project to use /generate-docs and /md-to-pdf."
