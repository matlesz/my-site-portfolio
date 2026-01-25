# Blog Modernization Plan

## Goals
- Present a modern, elegant, and professional visual identity.
- Improve readability and scanning for recruiters and peers.
- Make the portfolio feel intentional, not template-default.
- Keep changes compatible with Minimal Mistakes and GitHub Pages.

## Current Observations
- Theme is Minimal Mistakes with a dark skin; typography and spacing feel dense.
- Navigation is minimal, but key sections (projects, highlights) are not emphasized.
- The layout relies on defaults; custom styling is limited to small overrides.
- Posts mix emojis, long paragraphs, and dense sections, which can feel noisy.

## Visual Direction Options (pick one to anchor the style)
- Modern editorial: serif headings + clean sans body, generous spacing, muted palette.
- Sleek tech: geometric sans, crisp contrasts, subtle gradients, restrained accents.
- Executive portfolio: warm neutrals, minimal accents, strong hierarchy.

## Typography
- Replace default theme typography with a clear pairing (e.g., Serif for headings, Sans for body).
- Set a tighter scale: 1.0 body, 1.25, 1.56, 1.95, 2.44 for headings.
- Increase line-height for body copy (1.6 to 1.75) and widen max text width.
- Standardize heading casing and reduce emoji use in headings.

## Color and Theme
- Move away from default dark skin unless it is part of the brand story.
- Define CSS variables for a small palette: background, surface, text, muted, accent.
- Use one restrained accent color for links and callouts.
- Introduce subtle background texture or gradient for depth.

## Layout and Spacing
- Increase vertical rhythm: consistent section spacing and breathing room.
- Make the hero section more prominent with a short headline and value proposition.
- Add a highlight block for primary focus (security, devops, incident response).
- Rebalance the sidebar to feel secondary on desktop and collapsible on mobile.

## Navigation and Structure
- Add a Projects or Case Studies section and link it in navigation.
- Add a Highlights section on the home page: 3 to 4 key achievements.
- Keep navigation titles short and action oriented.
- Consider a landing page for portfolio with featured posts and skills.

## Imagery and Visuals
- Use a consistent avatar style or professional headshot.
- Add tasteful cover images for featured posts with a unified style.
- Standardize image ratios and compression (e.g., 16:9 or 4:3).

## Content Cleanup
- Reduce long paragraphs and break into short, scannable blocks.
- Use callouts sparingly for key insights instead of frequent emojis.
- Normalize tags and categories to a small set of strategic topics.
- Add a concise author bio and mission statement for consistency.

## Components and Enhancements
- Add a simple metrics strip (years experience, focus areas, certifications).
- Create a reusable project card include for featured work.
- Add a clean CTA section for contact or collaboration.

## Accessibility and SEO
- Keep heading order consistent and avoid skipped levels.
- Ensure color contrast meets WCAG AA for body text.
- Add `excerpt` for posts and pages used in previews.
- Use descriptive alt text and link text.

## Performance and Build
- Keep image sizes small and optimized.
- Avoid heavy JavaScript; use Minimal Mistakes built-ins where possible.
- Verify site builds with `bundle exec jekyll build`.

## Implementation Plan
1. Define design direction and palette (update `_config.yml` and `assets/css/main.scss`).
2. Update typography and layout spacing (custom CSS variables and overrides).
3. Refresh home page structure and add a portfolio landing page if desired.
4. Create reusable includes for project cards and highlight blocks.
5. Normalize post formatting and add feature images where relevant.
6. Update navigation and footer links for clarity and professionalism.
7. Validate accessibility and run a full build.

## Acceptance Checklist
- Visual hierarchy is clear on desktop and mobile.
- Navigation reflects core content (About, Projects, Posts, CV).
- Posts are readable without dense blocks or excessive emoji.
- Design feels cohesive across pages and posts.
- Build completes without warnings.

## Risks and Considerations
- Over-customizing may diverge from Minimal Mistakes defaults.
- Dark theme can limit professional tone for non-technical audiences.
- Additional includes increase maintenance unless documented.
