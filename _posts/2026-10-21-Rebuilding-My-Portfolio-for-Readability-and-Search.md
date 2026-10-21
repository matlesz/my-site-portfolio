---
title: "Rebuilding My Portfolio for Readability and Search"
date: 2026-10-21
layout: portfolio_article
project: "Portfolio"
author_profile: true
read_time: true
share: true
related: true
tags: [Portfolio, Jekyll, Accessibility, SEO, Web Performance]
description: "How I redesigned my Jekyll portfolio, kept article URLs intact, and checked the result with accessibility and Lighthouse audits."
---

My old portfolio had articles worth keeping, but the surrounding site did not give them a clear home. I rebuilt the presentation around the writing and project work, then spent almost as much time fixing the details that are easy to miss: mobile navigation, readable contrast, metadata, and the way the site behaved after deployment.

The rebuild stayed on Jekyll and GitHub Pages. I did not move the posts to another framework or change their URLs. The result is a custom set of layouts on top of the existing site, rather than a new application with the content copied into it.

## Keep the content, replace the presentation

I used custom layouts and shared includes for the header, head metadata, and footer. The home page introduces the work; Writing lists the posts with client-side search; Projects filters case studies by the `project` field in post front matter. About, CV, Contact, the archives, and individual articles use the same visual system. The articles still live in `_posts/` and keep their existing permalinks.

I chose a dark, Matrix-inspired palette as the default, with a light-mode toggle that remembers the selection in local storage. That choice also created work: bright green is useful for emphasis, but it does not make every button label or border readable. I adjusted the primary call to action, focus indicators, and muted colors after looking at the pages in both modes.

The mobile header took more iteration than the desktop layout. At one point the Contact button ran off the right edge on iPhone-sized viewports. At another, squeezing all the links into one row made their labels too small to use comfortably. I measured the controls in the browser at 320px, 375px, and 390px, then kept visible, centered buttons while tightening the layout at the narrowest width. The 320px layout no longer produced horizontal page overflow in that check; that is a viewport test, not a claim that every phone and browser combination has been tested.

## Search and metadata were part of the rebuild

The Writing page has a search box that filters article cards in the browser by title, excerpt, and tags. The Projects page filters cards by the `project` metadata already attached to posts. Neither feature needs a new search service. The controls also report results: the Writing search has a live status, and the project filters announce the active category and number of visible projects.

Separately, for search engines and link previews, I added explicit descriptions to posts that lacked them. This mattered because Jekyll's automatic excerpt could pick up a first-line quotation and put it in the article header or metadata. The shared head now provides canonical URLs, Open Graph and summary-card fields, article publication dates, and JSON-LD structured data for the site, author, and posts. I did not invent modified dates or social images where the source did not supply them. Those fields make the pages easier for machines to interpret; they do not guarantee a search ranking or rich result.

I also corrected a visible mistake during the audit: the old article template treated `read_time: true` as if it were a number and printed **“true min read.”** It now estimates minutes from article word count. That small bug is a good example of why inspecting generated HTML matters more than just checking whether a Jekyll build succeeds.

## Accessibility meant testing the actual controls

The redesign uses a skip link, a main landmark, labeled navigation, visible keyboard focus, and semantic headings. I changed the home-page section labels into headings and put their cards at the next heading level. Dates use `<time>` elements with machine-readable values. Article images have alt text, captions, and dimensions; below-the-fold images can load lazily. A reduced-motion preference suppresses the site's transitions.

Those changes help, but I am not treating a Lighthouse score as a WCAG certification. The production desktop audit still found an accessible-name mismatch on the header brand link: its `aria-label` says “ML Portfolio home” while the visible name includes “Mat Leszkiewicz.” A separate missing iframe-title finding came from a browser extension injected into the audit, not an iframe in the page. The two findings need different responses: fix the site's label; rerun the extension finding in a clean browser.

## What the Lighthouse runs actually showed

I ran Lighthouse against the **published homepage** on October 21, 2026, after the redesign was deployed. Two reports used different device profiles, so I do not treat their performance scores as a before-and-after comparison. LCP is the time until the largest visible piece of content appears:

| Production run | Performance | Accessibility | Best Practices | SEO | LCP |
| --- | ---: | ---: | ---: | ---: | ---: |
| Simulated mobile | 97 | 95 | 100 | 100 | 2.4 s |
| Desktop | 100 | 95 | 100 | 100 | 0.7 s |

These are lab measurements from those runs, not field data for every visitor. Cumulative layout shift (CLS) measures how much the page moves while loading: the mobile report recorded 0.003 and the desktop report 0.034. Both recorded zero total blocking time. The reports also pointed to an oversized homepage portrait served at 800×800 pixels for a much smaller displayed image, render-blocking CSS and Google Fonts, and cache lifetimes controlled in part by the hosting platform. Both 95 accessibility scores included an iframe-title failure caused by a browser extension; the desktop run also flagged the site's brand-link label, while the mobile run did not. Extension scripts likewise inflated the unused-JavaScript findings.

The scores were encouraging, but the useful output was the list of things still worth checking. A smaller responsive portrait and the brand-link accessible name are concrete follow-ups. I would rather make those changes and rerun the audit than quote a perfect desktop performance score as proof that the work is finished.

## Build and release checks

I added a GitHub Actions workflow that builds the site and checks generated internal links on pushes to `redesign/**` branches and pull requests targeting `master`. Direct pushes to `master` are not covered by that workflow. Locally, I ran the same Jekyll build and link checker while working through the layouts and content. The checker checks root-relative link routes; it is not an external-link crawler or a full accessibility test. The latest pre-article build checked 650 such links without finding a missing route.

The deployed stylesheet briefly failed to appear correctly in a browser after the merge. A hard refresh loaded it, and I added a build-time version query to the CSS URL so the URL changes on a new build instead of relying on a cached copy. That was a deployment lesson: a successful static build does not rule out a stale asset in someone's browser cache.

The portfolio is now easier for me to maintain as a Jekyll site: writing stays in Markdown, project grouping stays in front matter, and layout changes live in shared source files. The remaining work is measurable too—fix the header's accessible name, serve a smaller portrait, and repeat the accessibility audit without extensions before calling the audit complete.

## References

- [Jekyll documentation](https://jekyllrb.com/docs/)
- [WCAG 2.2](https://www.w3.org/TR/WCAG22/)
- [Google Search Central: SEO starter guide](https://developers.google.com/search/docs/fundamentals/seo-starter-guide)
- [Lighthouse documentation](https://developer.chrome.com/docs/lighthouse/overview/)
- [Web Vitals](https://web.dev/articles/vitals)
