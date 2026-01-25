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

## Homelab series

<div class="home-grid">
    <div class="home-card">
        <h3>Homelab Series</h3>
        <p>Ongoing infrastructure builds covering Proxmox, storage, networking, and secure remote access.</p>
        <ul class="home-list">
            {% for post in homelab_posts %}
            <li><a href="{{ post.url | relative_url }}">{{ post.title }}</a></li>
            {% endfor %}
        </ul>
    </div>
    <a class="home-card" href="{{ "/myGeekDB-Next.JS-app/" | relative_url }}">
        <h3>geekDb: Fullstack Movie Database</h3>
        <p>Next.js application with MongoDB-backed CRUD workflows and a modern UI.</p>
    </a>
    <a class="home-card" href="{{ "/RaspberryPi-RTSB-server/" | relative_url }}">
        <h3>Raspberry Pi RTSP Streaming Server</h3>
        <p>Edge streaming lab exploring protocols, networking, and reliability.</p>
    </a>
</div>

## More work

Explore the full archive in the posts section for detailed build notes, experiments, and infrastructure writeups.
