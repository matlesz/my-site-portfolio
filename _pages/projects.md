---
title: "Projects"
permalink: /projects/
layout: portfolio
classes: projects-page
eyebrow: "Selected work"
excerpt: "Projects and lab work focused on security, cloud infrastructure, automation, and systems."
---

<p class="projects-lede">These are the projects that best represent how I learn: build something useful, operate it in the real world, and write down what broke.</p>

{% assign project_names = site.posts | map: "project" | compact | uniq | sort %}
<div class="project-filters" role="group" aria-label="Filter projects" aria-controls="project-list">
    <button class="project-filter project-filter--active" type="button" data-project-filter="all" aria-pressed="true">All projects</button>
    {% for project_name in project_names %}
    <button class="project-filter" type="button" data-project-filter="{{ project_name | escape }}" aria-pressed="false">{{ project_name }}</button>
    {% endfor %}
</div>
{% assign project_posts = site.posts | where_exp: "post", "post.project" | sort: "date" | reverse %}
<p class="project-filter-status" role="status" aria-live="polite">All projects: {{ project_posts.size }} projects</p>

<div id="project-list" class="project-cards" data-project-list>
    {% for project in project_posts %}
    <a class="project-card" data-project-card data-project-name="{{ project.project | escape }}" href="{{ project.url | relative_url }}">
        <div class="project-card__meta"><time datetime="{{ project.date | date_to_xmlschema }}">{{ project.date | date: "%Y" }}</time> · {{ project.project }}</div>
        <h2>{{ project.title }}</h2>
        <p>{{ project.excerpt | strip_html | truncate: 190 }}</p>
        <span class="project-card__link">Read the case study <span aria-hidden="true">↗</span></span>
    </a>
    {% endfor %}
</div>

<p class="projects-empty" data-project-empty hidden>No projects match that filter.</p>

<div class="projects-more">
    <p class="portfolio-eyebrow">More experiments</p>
    <p>The full <a href="/posts/">writing archive</a> includes the smaller experiments, build notes, and infrastructure decisions behind these projects.</p>
</div>

<script>
    (function () {
        var buttons = Array.from(document.querySelectorAll("[data-project-filter]"));
        var cards = Array.from(document.querySelectorAll("[data-project-card]"));
        var empty = document.querySelector("[data-project-empty]");
        var status = document.querySelector(".project-filter-status");
        buttons.forEach(function (button) {
            button.addEventListener("click", function () {
                var filter = button.dataset.projectFilter;
                buttons.forEach(function (item) {
                    var active = item === button;
                    item.classList.toggle("project-filter--active", active);
                    item.setAttribute("aria-pressed", active ? "true" : "false");
                });
                var visible = cards.filter(function (card) {
                    var matches = filter === "all" || card.dataset.projectName === filter;
                    card.hidden = !matches;
                    return matches;
                }).length;
                empty.hidden = visible !== 0;
                if (status) {
                    status.textContent = button.textContent.trim() + ": " + visible + (visible === 1 ? " project" : " projects");
                }
            });
        });
    }());
</script>
