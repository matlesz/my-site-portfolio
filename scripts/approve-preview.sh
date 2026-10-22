#!/usr/bin/env bash
set -euo pipefail

preview_url="${1:-${PORTFOLIO_PREVIEW_URL:-http://127.0.0.1:4001/}}"
commit_sha="$(git rev-parse HEAD)"
approval_file="$(git rev-parse --git-path portfolio-preview-approved)"

if ! curl --fail --silent --show-error --max-time 5 "$preview_url" >/dev/null; then
    echo "Preview is not reachable at $preview_url" >&2
    exit 1
fi

{
    printf '%s\n' "$commit_sha"
    printf '%s\n' "$preview_url"
} > "$approval_file"
printf 'Approved local preview for %s at %s\n' "$commit_sha" "$preview_url"
