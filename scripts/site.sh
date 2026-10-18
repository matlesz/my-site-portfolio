#!/usr/bin/env bash
set -euo pipefail

repo_root="$(cd -- "$(dirname -- "${BASH_SOURCE[0]}")/.." && pwd)"
cd "$repo_root"

if ! command -v rbenv >/dev/null 2>&1; then
    echo "rbenv is required to run this site's Ruby 3.2 environment" >&2
    exit 1
fi

export RBENV_VERSION="${SITE_RUBY_VERSION:-3.2.2}"
export GEM_HOME="${SITE_GEM_HOME:-$HOME/.local/share/my-site-portfolio/gems}"
export GEM_PATH="$GEM_HOME"
export BUNDLE_IGNORE_CONFIG=1

if [ "$#" -eq 0 ]; then
    set -- serve
fi

exec rbenv exec bundle _2.4.10_ exec jekyll "$@"
