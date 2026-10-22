---
title: "Projects"
permalink: /projects/
layout: portfolio
classes: projects-page
eyebrow: "Selected work"
excerpt: "Projects and lab work focused on security, cloud infrastructure, automation, and systems."
---

<link rel="stylesheet" href="https://cdn.jsdelivr.net/npm/swiper@11/swiper-bundle.min.css">

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

<div class="projects-carousel" aria-label="Project case studies" data-project-carousel>
    <div id="project-list" class="swiper project-cards" data-project-list>
        <div class="swiper-wrapper">
            {% for project in project_posts %}
            <a class="swiper-slide project-card" data-project-card data-project-name="{{ project.project | escape }}" href="{{ project.url | relative_url }}">
                <div class="project-card__meta"><time datetime="{{ project.date | date_to_xmlschema }}">{{ project.date | date: "%Y" }}</time> · {{ project.project }}</div>
                <h2>{{ project.title }}</h2>
                <p>{{ project.excerpt | strip_html | truncate: 190 }}</p>
                <span class="project-card__link">Read the case study <span aria-hidden="true">↗</span></span>
            </a>
            {% endfor %}
        </div>
    </div>
    <div class="projects-carousel__controls" data-project-controls>
        <button class="swiper-button-prev" type="button" aria-label="Previous projects">←</button>
        <span class="projects-carousel__count" data-project-count aria-live="polite">1–1 of {{ project_posts.size }}</span>
        <button class="swiper-button-next" type="button" aria-label="Next projects">→</button>
    </div>
    <div class="swiper-pagination" aria-label="Project pages" data-project-pagination></div>
</div>

<p class="projects-empty" data-project-empty hidden>No projects match that filter.</p>

<div class="projects-more">
    <p class="portfolio-eyebrow">More experiments</p>
    <p>The full <a href="/posts/">writing archive</a> includes the smaller experiments, build notes, and infrastructure decisions behind these projects.</p>
</div>

<script src="https://cdn.jsdelivr.net/npm/swiper@11/swiper-bundle.min.js"></script>
<script>
    (function () {
        var buttons = Array.from(document.querySelectorAll("[data-project-filter]"));
        var cards = Array.from(document.querySelectorAll("[data-project-card]"));
        var empty = document.querySelector("[data-project-empty]");
        var status = document.querySelector(".project-filter-status");
        var count = document.querySelector("[data-project-count]");
        var controls = document.querySelector("[data-project-controls]");
        var pagination = document.querySelector("[data-project-pagination]");
        var carouselElement = document.querySelector("[data-project-carousel]");
        var reducedMotion = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
        var carousel = window.Swiper ? new window.Swiper(".projects-carousel .swiper", {
            a11y: { enabled: true },
            keyboard: { enabled: true },
            navigation: { nextEl: ".projects-carousel__controls .swiper-button-next", prevEl: ".projects-carousel__controls .swiper-button-prev" },
            pagination: { clickable: true, el: ".projects-carousel .swiper-pagination" },
            slidesPerView: 1,
            spaceBetween: 16,
            speed: reducedMotion ? 0 : 420,
            breakpoints: { 700: { slidesPerView: 2 }, 1100: { slidesPerView: 3 } }
        }) : null;
        var updateCount = function () {
            if (!carousel || !count) return;
            var visibleCards = cards.filter(function (card) { return !card.hidden; });
            var singleProject = visibleCards.length <= 1;
            if (controls) controls.hidden = singleProject;
            if (pagination) pagination.hidden = singleProject;
            if (carouselElement) carouselElement.classList.toggle("projects-carousel--single", singleProject);
            var activeCard = carousel.slides[carousel.activeIndex];
            var activePosition = Math.max(1, visibleCards.indexOf(activeCard) + 1);
            var perView = carousel.slidesPerViewDynamic ? carousel.slidesPerViewDynamic() : carousel.params.slidesPerView;
            var endPosition = Math.min(activePosition + perView - 1, visibleCards.length);
            count.textContent = visibleCards.length ? activePosition + "–" + endPosition + " of " + visibleCards.length : "0 of 0";
        };
        if (carousel) {
            carousel.on("slideChange resize", updateCount);
            updateCount();
        }
        buttons.forEach(function (button) {
            button.addEventListener("click", function () {
                var filter = button.dataset.projectFilter;
                var firstVisible = -1;
                buttons.forEach(function (item) {
                    var active = item === button;
                    item.classList.toggle("project-filter--active", active);
                    item.setAttribute("aria-pressed", active ? "true" : "false");
                });
                var visible = cards.filter(function (card, index) {
                    var matches = filter === "all" || card.dataset.projectName === filter;
                    card.hidden = !matches;
                    if (matches && firstVisible === -1) firstVisible = index;
                    return matches;
                }).length;
                empty.hidden = visible !== 0;
                if (carousel) {
                    carousel.update();
                    carousel.slideTo(firstVisible === -1 ? 0 : firstVisible, reducedMotion ? 0 : 420);
                    updateCount();
                }
                updateCount();
                if (status) {
                    status.textContent = button.textContent.trim() + ": " + visible + (visible === 1 ? " project" : " projects");
                }
            });
        });
    }());
</script>
