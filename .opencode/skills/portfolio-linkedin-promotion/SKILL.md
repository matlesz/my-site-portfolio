---
name: Portfolio LinkedIn Promotion
description: Prepare evidence-grounded LinkedIn posts and promotion strategies for new portfolio articles, with a practical technical voice and no invented claims.
---

# Portfolio LinkedIn promotion

Use this skill whenever a new article in this portfolio needs a LinkedIn post or
promotion plan. The goal is to turn one article into useful, credible LinkedIn
content that supports Mat's professional positioning without sounding like an
advertisement.

## Inputs to gather

Before drafting, read:

1. The complete article in `_posts/`.
2. The article's front matter, especially title, date, project, tags, and
   description.
3. Any referenced local image, diagram, or screenshot.
4. The portfolio URL and the article's actual permalink.
5. The closest related article when a series or comparison matters.

Ask for missing information instead of guessing. If the user provides a source
note or implementation document, treat it as the factual source and distinguish
completed work, tested behavior, plans, and limitations.

Never invent metrics, business outcomes, failures, tools, dates, audience
reactions, or personal actions. Do not claim that a visual exists unless it is
in the article or the user provides it. Remove private hostnames, addresses,
credentials, tokens, and sensitive infrastructure details.

## Positioning

Keep the portfolio's core positioning consistent:

> Mat is a support engineer who makes complex systems easier to operate through
> debugging, automation, observability, and security-minded infrastructure.

Choose one primary angle for each article:

- a concrete technical problem and its solution;
- a failure or debugging lesson;
- a reliability or security decision;
- a useful operational boundary; or
- a support-engineering lesson that generalizes beyond the homelab.

Do not turn every post into a tool announcement. Lead with the problem, decision,
tradeoff, or lesson.

## Primary post format

Draft one publish-ready post using this structure:

1. **Hook:** one specific problem, contrast, or lesson in the first two lines.
2. **Context:** what Mat built, changed, or investigated.
3. **Evidence:** three to five concrete technical details from the article.
4. **Lesson:** what the implementation changed or demonstrated.
5. **Question:** a specific question that invites experience from relevant
   practitioners.
6. **Article link:** the full URL at the end of the post.
7. **Hashtags:** two to four relevant tags, normally including the article's
   domain rather than generic reach tags.

Use short paragraphs and plain English. Prefer first person when the article
supports it. Keep enough technical specificity to be useful, but do not paste a
full article into LinkedIn. Avoid:

- generic motivational openings;
- exaggerated claims such as "game-changing" or "bulletproof";
- artificial engagement prompts;
- "comment YES" or follow-bait;
- unexplained acronyms;
- a long list of tools without a lesson; and
- unsupported claims about LinkedIn's algorithm.

Put the link in the post for clarity and accessibility. Do not assume that
putting it in the first comment improves reach; test link placement against the
user's own analytics if desired.

## Visual guidance

Recommend a visual only when it adds information:

- architecture or process diagram for a system flow;
- sanitized dashboard or terminal screenshot for an observed result;
- before/after comparison for a meaningful change; or
- no visual when the text is clearer without one.

Always mention when a suggested visual needs to be created. Never describe a
suggested visual as if it already exists.

## Promotion strategy

For each article, provide a short strategy with:

### Follow-up posts

Suggest two to four distinct follow-ups. Each must stand alone and focus on a
different article-supported detail, such as a failure, permission boundary,
rollback decision, validation step, or remaining limitation. Do not repeat the
same announcement.

### Engagement

Recommend manual, relevant participation:

- reply to substantive comments with concrete details;
- ask follow-up questions about the commenter's setup;
- comment usefully on posts from support, infrastructure, security, and DevOps
  practitioners; and
- avoid engagement pods, automated comments, and generic replies.

### Measurement

Recommend tracking:

- profile views;
- relevant connection requests;
- substantive comments;
- saves;
- article clicks;
- referral sessions; and
- conversations or opportunities generated.

Give the article a UTM example using:

```text
?utm_source=linkedin&utm_medium=social&utm_campaign=<short-article-slug>
```

Treat impressions as a distribution signal, not the primary measure of
professional value. LinkedIn's ranking system is partly opaque; posting times,
link placement, formats, and hashtags are hypotheses to test, not guarantees.

## Required output

Return the following sections:

1. **Recommended angle** — one sentence.
2. **LinkedIn post draft** — ready to edit and publish.
3. **Visual recommendation** — existing visual, suggested new visual, or text-only.
4. **Promotion sequence** — two to four follow-up ideas.
5. **Engagement plan** — practical actions around publication.
6. **Measurement** — metrics and a UTM URL.
7. **Fact and limitation check** — claims intentionally avoided or details that
   need confirmation.

If the user asks only for a post, provide the draft plus a brief visual note and
omit the longer strategy unless it is needed to prevent a factual or strategic
mistake.

## Reference guidance

Use these as general platform guidance, not as promises of reach:

- [LinkedIn: Create](https://members.linkedin.com/create)
- [LinkedIn Marketing: Content Marketing](https://www.linkedin.com/business/marketing/blog/content-marketing)
- [LinkedIn Help: Share photos or videos](https://www.linkedin.com/help/linkedin/answer/a507663)
- [LinkedIn Help: Analytics](https://www.linkedin.com/help/linkedin/answer/a547077)
