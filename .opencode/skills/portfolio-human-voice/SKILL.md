---
name: Portfolio Human Voice
description: Draft or humanize first-person portfolio articles and Jekyll posts in this repository. Use when writing a new project story, revising an existing post, or making technical prose sound like Mat rather than a generic AI article.
---

# Portfolio human voice

Write articles about work Mat actually did, in a direct first-person voice. This
is a standalone adaptation of the human-tone and humanize standards, not a
customer-support reply workflow. Do not import ticket policies, greetings,
sign-offs, word caps, or external reviewers.

## Gather facts before writing

1. Read the user's notes, project files, and the closest relevant posts in
   `_posts/`. For homelab writing, compare the current story with the existing
   homelab posts. Preserve Mat's plain, practical first-person register, not
   their incidental filler or formatting habits.
2. Separate what was built and checked from what is planned, assumed, or still
   broken. Use dates, versions, commands, decisions, measurements, and setbacks
   only when the source supports them. Never invent a test result, quote,
   failure, motivation, feeling, or first-person action to make the story vivid.
3. If a load-bearing claim has no source, ask for it or mark it `[VERIFY: ...]`
   in a draft. Do not publish with verification markers. Replace private IPs,
   hostnames, tokens, and credentials with safe placeholders when needed.

## Draft the article

- Lead with the real problem, decision, or result. Say why **I** made that
  choice where the source establishes it; don't force first person into every
  sentence or turn a shared effort into an individual achievement.
- Keep the technical mechanism intact. A useful passage tells a reader what
  changed, why an alternative lost, what happened when tested, and what remains
  unfinished. Concrete details beat a polished summary.
- Use headings, lists, code blocks, and links when they help someone follow a
  longer article. Blog posts are not short support emails: there is no fixed
  word count, mandatory warm opening, or required closing question.
- Match the post's actual stage. Say "I plan to" for unfinished work, not "I
  built"; acknowledge uncertainty only where it exists. Link external sources
  you actually used, without fabricating citations.

## Humanize pass

Write the plain version first, then edit it once for voice:

1. **Remove connective wrappers that carry no information.** Cut throat-clearing
   ("It's worth noting that"), scene-setting ("In today's fast-paced world"),
   self-commentary ("This highlights the importance of..."), and a sentence
   announcing a point the next sentence already makes. Let the fact start the
   paragraph.
2. Prefer the literal noun and verb. "The SSH connection timed out" says more
   than "the environment presented connectivity challenges." Use exact names
   and numbers from the source; don't create specificity by guessing.
3. Check repeated *shapes*, not just banned words. Too many "not X, but Y"
   turns, neat three-part lists, symmetric paragraphs, mini-slogans, and
   identical sentence lengths make the writing feel assembled. Break the
   pattern by stating the next fact, not by adding deliberate roughness.
4. Replace inflated words when a plain one does the same job: "delve",
   "showcase", "pivotal", "robust", "seamless", "leverage", "tapestry" and
   "comprehensive" are warning signs, not forbidden strings. Keep a term when
   it has a precise technical meaning. Use em dashes deliberately, not as a
   default transition.
5. Do not add fake typos, manufactured warmth, triumph, or a quotable final
   line. If a project had a limitation or a dead end, say what happened and
   what you did next. Don't claim to have checked something you only inferred.

Compare the revised draft with its source once more. Every technical fact,
status, link, command, and author claim must still match. A cleaner sentence
that loses a version number or changes a plan into a completed deployment is
worse than the original.

### Quick example

Generic: "This journey showcases a robust and seamless networking solution."

Grounded in the existing Tailscale post: "I tried OCI first because the free
tier was attractive. SSH kept timing out, and the package install ran out of
memory. I moved the peer relay to AWS."

## Work in this repository

When asked to create a post, follow `AGENTS.md` for `_posts/` filenames,
front matter, tags, Markdown, links, and Jekyll validation. Do not edit `_site/`
or publish a post unless the user asked for one. When asked only to humanize a
draft, preserve its claims and return the revision with a short note about
anything that still needs verification. The author decides what gets published.
