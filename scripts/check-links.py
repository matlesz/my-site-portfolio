#!/usr/bin/env python3
"""Check root-relative links in the generated Jekyll site."""

from html.parser import HTMLParser
from pathlib import Path
from urllib.parse import urlparse
import sys


class LinkParser(HTMLParser):
    def __init__(self):
        super().__init__()
        self.hrefs = []

    def handle_starttag(self, tag, attrs):
        for name, value in attrs:
            if name == "href" and value:
                self.hrefs.append(value)


def route_exists(site, path):
    relative = path.lstrip("/")
    candidates = [site / relative, site / f"{relative}.html", site / relative / "index.html"]
    return any(candidate.exists() for candidate in candidates)


def main():
    site = Path(sys.argv[1] if len(sys.argv) > 1 else "_site")
    if not site.is_dir():
        print(f"Missing generated site directory: {site}", file=sys.stderr)
        return 1

    checked = 0
    missing = set()
    for html_file in site.rglob("*.html"):
        parser = LinkParser()
        parser.feed(html_file.read_text(encoding="utf-8", errors="ignore"))
        for href in parser.hrefs:
            parsed = urlparse(href)
            if parsed.scheme or href.startswith("//") or href.startswith("#"):
                continue
            path = parsed.path or "/"
            if not path.startswith("/"):
                continue
            checked += 1
            if not route_exists(site, path):
                missing.add(path)

    print(f"Checked {checked} internal links")
    if missing:
        print("Missing routes:", file=sys.stderr)
        print("\n".join(sorted(missing)), file=sys.stderr)
        return 1
    print("No missing internal routes")
    return 0


if __name__ == "__main__":
    raise SystemExit(main())
