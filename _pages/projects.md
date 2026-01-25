---
title: "Projects"
permalink: /projects/
layout: single
author_profile: true
excerpt: "Selected project case studies focused on security, cloud, and systems work."
---

This page highlights the projects and lab work that represent the way I approach infrastructure engineering, automation, and security operations.

{% assign homelab_posts_upper = site.posts | where_exp: "post", "post.tags contains 'Homelab'" %}
{% assign homelab_posts_lower = site.posts | where_exp: "post", "post.tags contains 'homelab'" %}
{% assign homelab_posts = homelab_posts_upper | concat: homelab_posts_lower | uniq | sort: "date" | reverse %}

<section class="home-section">
    <div class="home-section__header">
        <h2 class="home-section__title">Homelab series</h2>
        <span class="home-section__rule" aria-hidden="true"></span>
        <p class="home-section__subtitle">Ongoing infrastructure builds covering Proxmox, storage, networking, and secure remote access.</p>
    </div>
    {% assign homelab_featured_titles = "How OpenCode + ChatGPT Accelerated My Homelab|Building My HomeLab: From Scratch to Self-Hosting|How to Choose Your First Home Server Hardware: A Practical Guide" | split: "|" %}
    <div class="entries-list">
        {% for homelab_title in homelab_featured_titles %}
        {% assign featured_post = homelab_posts | where: "title", homelab_title | first %}
        {% if featured_post %}
        {% assign post = featured_post %}
        {% include archive-single.html type="list" %}
        {% endif %}
        {% endfor %}
    </div>
</section>

<section class="home-section">
    <div class="home-section__header">
        <h2 class="home-section__title">Other project</h2>
        <span class="home-section__rule" aria-hidden="true"></span>
    </div>
    {% assign project_featured_titles = "geekDb: A Fullstack Movie Database Built with Next.js|Turning a Raspberry Pi into an RTSP Streaming Server" | split: "|" %}
    <div class="entries-list">
        {% for project_title in project_featured_titles %}
        {% assign project_post = site.posts | where: "title", project_title | first %}
        {% if project_post %}
        {% assign post = project_post %}
        {% include archive-single.html type="list" %}
        {% endif %}
        {% endfor %}
    </div>
</section>

<section class="home-section">
    <div class="home-section__header">
        <h2 class="home-section__title">More work</h2>
        <span class="home-section__rule" aria-hidden="true"></span>
    </div>
    <p>Explore the full archive in the posts section for detailed build notes, experiments, and infrastructure writeups.</p>
</section>
