# AGENTS

## Purpose
- Provide commands and conventions for agentic changes in this repo.
- Repository is a Jekyll site using Minimal Mistakes and GitHub Pages.
- Prefer editing source content, not generated output.

## Repository layout
- `_config.yml` global site settings and theme config.
- `_data/` YAML data files (navigation, etc).
- `_includes/` HTML/Liquid partials (custom head, footer).
- `index.html` custom home page content (layout home).
- `_pages/` standalone pages with front matter.
- `_posts/` dated blog posts.
- `assets/css/main.scss` theme imports and custom CSS overrides.
- `assets/images/` site images and icons.
- `plans/` internal planning docs (not site content).
- `_site/` generated site output; do not edit by hand.

## Setup
- Ruby + Bundler are required; gems are defined in `Gemfile`.
- Install dependencies with `bundle install`.

## Build and dev commands
- Dev server: `bundle exec jekyll serve`
- Dev server with drafts: `bundle exec jekyll serve --drafts`
- Dev server with live reload: `bundle exec jekyll serve --livereload`
- Build static site: `bundle exec jekyll build`
- Clean generated files: `bundle exec jekyll clean`
- If you change `_config.yml`, restart the dev server.

## Lint and tests
- No linting tools are configured in this repo.
- No automated test runner is configured.
- Single-test command: not applicable (no test suite).

## Content conventions
- All pages and posts start with YAML front matter in `---` blocks.
- Use `layout: single` unless another layout is required.
- Prefer explicit `permalink` for pages in `_pages`.
- Posts in `_posts` follow the `YYYY-MM-DD-Title.md` filename pattern used here.
- Home and Projects pages list posts tagged `Homelab` or `homelab`; keep that tag on homelab series posts.
- Keep front matter keys ordered consistently: `title`, `date`, `permalink`, `layout`, then feature flags.
- Use lower-case booleans (`true`/`false`) in front matter.
- Tags are a YAML list: `tags: [Tag One, Tag Two]`.

## Front matter reference
- Posts: `title`, `date`, `layout`, `author_profile`, `read_time`, `share`, `related`, `tags`.
- Pages: `title`, `permalink`, `layout`, `author_profile`, `excerpt` when needed.
- Dates use ISO format (`YYYY-MM-DD`).
- Wrap titles in double quotes if they include punctuation.
- Keep excerpt text short and sentence-cased.

## Markdown style
- Use blank lines to separate blocks; avoid trailing whitespace.
- Prefer ATX headers (`##`) and keep heading levels consistent.
- Use fenced code blocks with language labels (e.g. ```yaml).
- Links should include full URLs for external resources.
- Use standard Markdown; avoid custom HTML unless needed.
- If HTML is required, keep it minimal and valid.

## YAML style
- Indent with 2 spaces, no tabs.
- Use quotes for strings with punctuation or leading/trailing whitespace.
- Keep lists aligned under their parent key, one item per line when long.
- Sort navigation items in `_data/navigation.yml` by display order.

## Liquid and HTML
- Indent HTML and Liquid blocks with 4 spaces.
- Keep Liquid tags aligned with the HTML structure for readability.
- Use double quotes for HTML attributes.
- Use `rel="nofollow noopener noreferrer"` on external links (see `footer.html`).
- Prefer small includes in `_includes/` instead of repeating blocks in pages.
- Avoid deeply nested Liquid where a data file can drive the structure.
- TryHackMe badge embeds should use the `.tryhackme-embed` wrapper and `.tryhackme-embed__frame` iframe classes for responsive layout.

## SCSS/CSS
- Keep theme imports at the top of `assets/css/main.scss`.
- Keep the YAML front matter (`---`) at the top of `assets/css/main.scss` so Jekyll recompiles the stylesheet.
- Add custom overrides below the imports.
- Use 4-space indentation in SCSS blocks to match existing style.
- Use `!important` only when required to override the theme.
- Favor class selectors over element selectors for overrides.
- Keep media queries grouped with the related selectors.
- Reuse `:root` tech palette tokens (`--tech-*`) instead of adding new hex colors.
- Home and Projects layout components rely on `.home-*` classes (hero, metrics, grid, cards).
- Font pairing is Manrope (body) + Space Grotesk (headings); keep CSS in sync with `_includes/head/custom.html`.

## JavaScript (inline)
- Inline JS lives in `_includes/head/custom.html`.
- Use 4-space indentation and double quotes to match existing style.
- Guard global dependencies before use (e.g., check `window.cookieconsent` exists).
- Prefer `window.addEventListener("load", ...)` for initialization.
- Keep scripts small; use CDN links for third-party libraries.
- Google Fonts links and cookie consent assets are also defined in `_includes/head/custom.html`.

## Naming conventions
- Pages in `_pages` use concise lowercase filenames with hyphens.
- Posts filenames start with date and use title case words separated by spaces or hyphens, matching existing files.
- Use descriptive `title` values in front matter; keep them consistent with the file name.
- Image filenames in `assets/images` should be lowercase with hyphens.

## Data and navigation
- Use `_data/navigation.yml` for top nav updates.
- Keep `title` values quoted for navigation items.
- URLs should be root-relative (e.g., `/about/`).

## Error handling and safety
- For Liquid, avoid referencing missing data keys; use defaults or conditionals.
- For JS, check optional objects before calling methods.
- For external embeds (iframes), verify the URL and keep HTML minimal.

## Theme usage
- The site uses `remote_theme: mmistakes/minimal-mistakes`.
- Prefer customization through `_config.yml`, `_data/*`, and `assets/css/main.scss`.
- Avoid editing theme files inside the gem or `_site`.

## Images and media
- Place images in `assets/images` and reference with absolute paths.
- Use descriptive alt text when embedding images in Markdown.
- Optimize large images before committing.

## Accessibility and SEO
- Use heading levels in order without skipping.
- Provide alt text for images and meaningful link text.
- Use `excerpt` front matter for SEO snippets when relevant.
- Avoid overly long titles; keep under roughly 70 characters.
- Keep per-post meta sections in content if present.

## Formatting and typography
- Use sentence case for body text; avoid ALL CAPS.
- Keep line length reasonable in prose; wrap at paragraph boundaries.
- Use lists for step-by-step instructions.
- Use consistent spelling (US English).
- Avoid inline styles; use SCSS overrides instead.

## Generated output
- `_site/` is generated by Jekyll; do not edit or hand-patch files there.
- When making content or style changes, regenerate via `bundle exec jekyll build`.

## Local dev notes
- The site runs on `http://localhost:4000` by default.
- Config changes require a server restart.
- If you see missing GitHub metadata warnings, they are expected without tokens.
- Pagination is set high (`paginate: 100`) to avoid extra pages for small post counts.

## Cursor and Copilot rules
- No Cursor rules found (`.cursor/rules/` or `.cursorrules`).
- No Copilot instructions found (`.github/copilot-instructions.md`).

## Quick checks before commit
- Run `bundle exec jekyll build` to verify the site compiles.
- Ensure new posts render correctly in the dev server.
- Check links and embeds manually since no automated link checker exists.
- Avoid committing secrets; the repo is public-facing content.

## Notes for agents
- Respect existing content tone and formatting.
- Keep changes scoped to source files, not generated output.
- Prefer minimal, reversible edits; avoid global rewrites.
- When uncertain about style, follow the closest existing file in the same folder.
