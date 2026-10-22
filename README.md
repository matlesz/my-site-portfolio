# Minimal Mistakes remote theme starter

Click [**Use this template**](https://github.com/mmistakes/mm-github-pages-starter/generate) button above for the quickest method of getting started with the [Minimal Mistakes Jekyll theme](https://github.com/mmistakes/minimal-mistakes).

Contains basic configuration to get you a site with:

- Sample posts.
- Sample top navigation.
- Sample author sidebar with social links.
- Sample footer links.
- Paginated home page.
- Archive pages for posts grouped by year, category, and tag.
- Sample about page.
- Sample 404 page.
- Site wide search.

Replace sample content with your own and [configure as necessary](https://mmistakes.github.io/minimal-mistakes/docs/configuration/).

## Local preview on this Mac

This site uses the GitHub Pages/Jekyll 3 bundle. The default Homebrew Ruby 4
does not run its older gems. Use the installed rbenv Ruby 3.2.2 and Bundler
2.4.10 instead:

```bash
./scripts/site.sh build
./scripts/site.sh serve
```

Open <http://127.0.0.1:4000> after starting the server. The wrapper selects
Ruby 3.2.2 and uses gems in `~/.local/share/my-site-portfolio/gems`, outside
the iCloud-synced checkout. On another machine, install that Ruby/Bundler and
the `Gemfile` dependencies before running the wrapper. `Gemfile.lock` and
`vendor/bundle/` are local, ignored files; do not commit them or `_site/`.

## Preview and branch workflow

This checkout uses the versioned `.githooks/pre-push` hook to block all direct
pushes to `master`. Install it once after cloning:

```bash
git config core.hooksPath .githooks
```

Create a feature branch, start a preview, and review the changed pages before
opening a pull request:

```bash
./scripts/site.sh serve --host 127.0.0.1 --port 4001
git switch -c article/my-change
git push origin HEAD
```

The hook rejects `refs/heads/master` even when a local preview approval exists.

---

## Troubleshooting

If you have a question about using Jekyll, start a discussion on the [Jekyll Forum](https://talk.jekyllrb.com/) or [StackOverflow](https://stackoverflow.com/questions/tagged/jekyll). Other resources:

- [Ruby 101](https://jekyllrb.com/docs/ruby-101/)
- [Setting up a Jekyll site with GitHub Pages](https://jekyllrb.com/docs/github-pages/)
- [Configuring GitHub Metadata](https://github.com/jekyll/github-metadata/blob/master/docs/configuration.md#configuration) to work properly when developing locally and avoid `No GitHub API authentication could be found. Some fields may be missing or have incorrect data.` warnings.
