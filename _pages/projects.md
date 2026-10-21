---
title: "Projects"
permalink: /projects/
layout: portfolio
classes: projects-page
eyebrow: "Selected work"
excerpt: "Projects and lab work focused on security, cloud infrastructure, automation, and systems."
---

<p class="projects-lede">These are the projects that best represent how I learn: build something useful, operate it in the real world, and write down what broke.</p>

{% assign project_titles = "Running a Private AI and SearXNG Stack in My Homelab|Homelab Backup Strategy: 3-2-1 with PBS, Restic, Backrest, and Jottacloud|Homelab Observability: Grafana + Prometheus + Loki|Building My HomeLab: From Scratch to Self-Hosting|Building Parallel CI/CD Pipelines with AWS at Fundrecs|Turning a Raspberry Pi into an RTSP Streaming Server" | split: "|" %}

<div class="project-cards">
    {% for project_title in project_titles %}
    {% assign project = site.posts | where: "title", project_title | first %}
    {% if project %}
    <a class="project-card" href="{{ project.url | relative_url }}">
        <div class="project-card__meta">{{ project.date | date: "%Y" }} · {% if project.tags.first %}{{ project.tags.first }}{% endif %}</div>
        <h2>{{ project.title }}</h2>
        <p>{{ project.excerpt | strip_html | truncate: 190 }}</p>
        <span class="project-card__link">Read the case study <span aria-hidden="true">↗</span></span>
    </a>
    {% endif %}
    {% endfor %}
</div>

<div class="projects-more">
    <p class="portfolio-eyebrow">More experiments</p>
    <p>The full <a href="/posts/">writing archive</a> includes the smaller experiments, build notes, and infrastructure decisions behind these projects.</p>
</div>
