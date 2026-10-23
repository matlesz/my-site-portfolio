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

I wanted my homelab to update itself, but I did not want “automatic” to mean hoping the new container works. The lab runs enough services that weekly updates are useful, but it also includes databases, a GPU host, a VPN network namespace, and a public-facing Nextcloud instance. One bad update can affect more than one container.

I started turning the process into a controlled operation: detect a candidate version, preserve the current state, deploy the change, watch what happens, and restore the previous version if the health check fails.

I am treating this as a test platform before introducing a real GitOps workflow. I want to prove the inventory, health gates, rollback path, and failure reporting first. A GitOps controller should not simply reconcile a bad image faster; it should have a safe operational boundary around the change.

<figure>
    <img src="/assets/images/homelab-update-rollback-flow.svg" alt="Update flow from WUD candidate detection through backup freshness checks, snapshots, deployment, health gates, observation, and rollback on failure" width="1200" height="430" loading="lazy" decoding="async">
    <figcaption>The update path checks the current state before deployment, then keeps or rolls back the new version based on service health.</figcaption>
</figure>

## Starting with application inventory

The first thing I was missing was visibility. I already had Grafana and Prometheus, but I needed a clearer view of what each Docker host was actually running.

I extended the existing stack with a small Docker inventory exporter. It reports:

- container state and health;
- configured image and deployed version;
- image digest;
- container recreation time;
- image creation time; and
- HTTP availability.

The exporter runs on both Docker hosts and publishes the data through the existing node-exporter textfile collector. The Docker socket stays on the host; Grafana and n8n never receive it.

The Grafana dashboard brings together application availability, Docker health, and deployed image versions. Now I can review the current state before changing anything.

## Adding registry awareness with WUD

The inventory tells me what is running, but not whether a registry has a newer image. I deployed What’s Up Docker (WUD) on both Docker hosts for that part.

WUD checks registries for newer image tags and digests. It runs behind an internal Docker socket proxy and uses an authenticated, tailnet-only interface. Automatic updates remain disabled by default, so WUD reports candidates without applying them by itself.

The updater reads WUD’s local metrics before a Compose transaction. Compatible, non-major candidates can be promoted into the Compose file before the image is pulled. Major candidates remain pending. That distinction matters for PostgreSQL: changing `postgres:15` to `postgres:18` is not automatically a safe database migration.

## Cleaning up the Nextcloud database migration

The active Nextcloud instance is now PostgreSQL-backed and managed separately from the retired MariaDB stack. As part of that cleanup, I:

- removed the obsolete MariaDB containers and images;
- retained the old database and configuration data for recovery;
- added a dedicated PostgreSQL backup service;
- verified the backup with a real database dump;
- converted the active Nextcloud instance into a managed Compose project; and
- updated the updater so it cannot accidentally resurrect the old MariaDB deployment.

This separation matters for rollback. Keeping old files around for recovery is different from allowing the old deployment to become part of a normal update transaction again.

## The update transaction

The updater runs as a systemd service, so it does not depend on a web UI being available. For each Compose project it:

1. checks required backup freshness for stateful services;
2. records the current Compose and environment files;
3. snapshots the running images and creates rollback tags;
4. selects a WUD candidate version;
5. pulls the image and recreates the containers;
6. verifies the service health;
7. observes the service for two minutes;
8. rolls back automatically if the health gate fails; and
9. keeps rollback snapshots for fourteen days.

Healthchecks failure reporting is routed towards Telegram, and the update interface remains available through Portainer and WUD. The rollback mechanism was also tested independently with a temporary Compose canary rather than relying only on a successful update run.

For stateful applications, an image snapshot is only part of the story. Nextcloud has its dedicated PostgreSQL backup service, and other stateful services use backup freshness gates before an update. A database major upgrade still requires a separate migration and restore procedure.

## A real failure was more useful than a green test

A full update run exposed an actual SearXNG problem. Its Gluetun container repeatedly returned `AUTH_FAILED` from NordVPN. SearXNG’s HTTP endpoint could still appear available, but its VPN tunnel was not healthy enough for the service to pass the update gate.

The failure exposed two weaknesses in the updater:

- rollback image pruning could remove images that were still needed; and
- checking only SearXNG’s HTTP endpoint could miss an unhealthy VPN tunnel.

I corrected both behaviours. Rollback images are no longer aggressively pruned, and SearXNG now requires a healthy VPN before and after an update. I repaired the VPN session and verified that SearXNG returned live search results again.

## Grafana as a complete upgrade test

Grafana gave me a second useful test of the transaction. WUD detected version 13.2.4 while the Compose file still referenced 10.4.3.

The first upgrade attempt failed because the startup grace period was too short. The updater restored Grafana 10.4.3 automatically. I retried with a longer readiness window, and Grafana 13.2.4 started successfully. I also verified that the dashboards and database were healthy after the upgrade.

That failure was useful because the rollback was not theoretical. The system made a change, rejected the result, restored the previous version, and then succeeded after I adjusted the readiness window.

## What remains manual

Major database upgrades, such as PostgreSQL 15 to 18, remain manual. A database major upgrade needs a tested migration and restore procedure; changing the image tag alone is not a rollback strategy. The same rule applies to updates that change a persistent data format rather than simply replacing an image.

The weekly schedule can handle compatible image and tag changes automatically, but schema-changing upgrades remain explicitly approved operations. I can still access the update process through Portainer and WUD when I want to review a candidate or intervene manually.

## The result

The homelab now has:

- centralized application and version visibility;
- registry update detection;
- weekly automated update scheduling;
- per-service rollback snapshots;
- health-gated updates;
- a post-update observation window;
- Telegram failure notification paths;
- GUI access through Portainer and WUD; and
- an explicit separation between routine updates and major database migrations.

The important change is not that every update is automatic. It is that routine updates have a transaction around them, failures have a recovery path, and data migrations stop for an explicit decision. Once these controls are reliable, they give me a better foundation for deciding which parts of the homelab should move to a real GitOps model.

## Research and project references

- [Docker Compose documentation](https://docs.docker.com/compose/)
- [Prometheus documentation](https://prometheus.io/docs/)
- [Grafana documentation](https://grafana.com/docs/)
- [What’s Up Docker documentation](https://getwud.github.io/wud/)
- [Healthchecks documentation](https://healthchecks.io/docs/)
- [Portainer documentation](https://docs.portainer.io/)
- [SearXNG documentation](https://docs.searxng.org/)
- [Gluetun project](https://github.com/qdm12/gluetun)