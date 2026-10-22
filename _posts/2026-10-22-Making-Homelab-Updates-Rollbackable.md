---
title: "Making Homelab Updates Rollbackable"
date: 2026-10-22
layout: portfolio_article
project: "Homelab"
author_profile: true
read_time: true
share: true
related: true
tags: [Homelab, Automation, Observability, Docker, Reliability]
description: "How I turned weekly Docker updates into an observable, health-gated process with WUD, Grafana, backups, and rollback snapshots."
---

I wanted my homelab to update itself, but I did not want “automatic” to mean “hope the new container works.” The lab runs enough services that a weekly update is useful, yet it also includes databases, a GPU host, a VPN network namespace, and a public-facing Nextcloud instance. A failed update can affect more than one container.

This week I started turning updates into a controlled operation: detect a candidate version, preserve the current state, deploy the change, observe the result, and restore the previous version if the health check fails.

## Starting with a clearer inventory

The first missing piece was visibility. I already had Prometheus, Grafana, blackbox probes, cAdvisor, and Homepage, but the dashboards did not answer a simple question: which image is each application actually running?

I added a small host-side inventory exporter for the two Docker hosts. It publishes container state, health, configured image, deployed tag, image digest, container recreation time, and image creation time through the existing node-exporter textfile collector. The Docker socket stays on the host; Grafana and n8n never receive it.

The resulting Grafana dashboard combines three views:

- application HTTP availability;
- Docker container state and health;
- deployed image versions and local update timestamps.

That made the current state easier to review before touching anything.

## Adding registry awareness with WUD

The inventory tells me what is running. It does not tell me whether the registry has a newer tag or digest. For that, I deployed What’s Up Docker (WUD) on both hosts.

WUD runs behind an internal Docker socket proxy and uses an authenticated, tailnet-only interface. Its automatic trigger is disabled. It can report candidates such as a newer Prometheus or exporter version, while manual actions remain deliberate.

The update workflow now reads WUD’s local metrics before a Compose transaction. Non-major candidate tags can be promoted into the Compose file before the image is pulled. Major candidates remain pending. That distinction matters for images such as PostgreSQL: a new image tag is not automatically a safe database migration.

## The transaction

The updater runs as a systemd service rather than depending on a web UI being available. For each Compose project it:

1. checks required backup freshness for stateful services;
2. records the Compose file and environment file;
3. tags the currently running images for rollback;
4. applies a WUD candidate when it is a compatible non-major update;
5. pulls and recreates the project;
6. checks the service endpoint or container health;
7. observes the service for two minutes with ten-second checks;
8. restores the previous Compose and image state if the service fails.

Snapshots are kept for fourteen days. Broad Docker image pruning is disabled because it can remove the very images needed for rollback.

For stateful applications, the image snapshot is only part of the story. Nextcloud now has a dedicated PostgreSQL backup service, and n8n and Home Assistant have freshness gates before updates. A database major upgrade still requires a separate migration and restore procedure; changing `postgres:15` to `postgres:18` is not a rollback plan.

## A real failure was more useful than a green test

The first full run surfaced a genuine SearXNG problem. Its Gluetun container repeatedly received `AUTH_FAILED` from NordVPN. SearXNG’s web process was still present, but its VPN health was not acceptable.

That exposed two design issues. The updater needed to treat VPN health as part of SearXNG health, and rollback images must not be pruned at the end of an update. I added a pre-update and post-update VPN gate, disabled destructive image pruning, repaired the VPN session, and verified that SearXNG returned live search results again.

Grafana provided another useful test. WUD reported version 13.2.4 while the Compose file still referenced 10.4.3. The first upgrade attempt failed its short startup grace and automatically restored 10.4.3. A retry with a longer readiness window succeeded, and Grafana is now healthy on 13.2.4 with its dashboards and database intact.

## What I am deliberately not automating yet

The weekly timers are designed to run during the night on both Docker hosts, with Healthchecks pings routed to Telegram on failure. Manual update access is available through Portainer and WUD.

I am keeping major database upgrades manual until I can test the complete path in a disposable copy: backup, migration, application validation, and data restore. The same rule applies to any update that changes a persistent data format rather than simply replacing an image.

This is a better definition of automation for my homelab. The system can do routine work by itself, but it also records what changed, keeps a way back, and stops at the boundary where an image update becomes a data migration.
