---
title: "Building My HomeLab: From Scratch to Self-Hosting"
date: 2025-07-23
layout: single
author_profile: true
read_time: true
share: true
related: true
tags: [Homelab, Self-Hosting, Proxmox, Virtualization, Projects]
---

> "If it ain't broke, you haven't installed Jellyfin yet."

Over the last few months, I've been on a mission to build a full-featured home lab. What started as a simple curiosity about self-hosting quickly turned into an exciting project where I learned more than any tutorial could teach.

My goal? Host essential services like file storage, media streaming, DNS filtering, automation, and remote access using **Proxmox** as the foundation. Along the way, I made plenty of wrong turns (some hilariously frustrating), discovered best practices, and learned how to troubleshoot effectively.

This post documents that journey—failures, fixes, and all. If you're building your own home lab or just want to see how a tech-savvy generalist tackles infrastructure from scratch, you're in the right place.

---

## 🧱 Architecture Overview

Here is the high-level layout of my infrastructure:

```asciidoc
[Proxmox VE Host]
|
|-- pfSense (VM) ............. Firewall / DHCP / NAT
|-- TrueNAS (VM) ............. Storage via USB HDD Enclosure
|-- DockerVM (VM, IP: 192.168.68.111)
|   |-- Portainer ............ Docker Management UI
|   |-- Jellyfin ............. Media Server
|   |-- Nextcloud ............ File Sync & Share
|   |-- n8n .................. Workflow Automation
|   |-- cAdvisor ............. Docker monitoring
|-- AdGuard Home (LXC) ....... DNS & Ad Blocking
|-- Tailscale (LXC + Host) ... Secure Remote Access
|-- Samba Share (Host) ....... Shared Mount for Containers
```

---

## 🐳 DockerVM and Containerized Services

To keep things organized and easily manageable, I use a dedicated **Docker VM** running Ubuntu. This VM acts as the backbone for containerized services. One of the first things I installed here was **[Portainer](https://docs.portainer.io/)** — a simple but powerful web UI for managing Docker containers and volumes.

### Why a separate Docker VM?
- Isolates container workloads from the Proxmox host
- Easy backups and restores
- Easier resource monitoring via `htop`, `cAdvisor`, and Portainer

### Services Running Inside:
- **[Jellyfin](https://jellyfin.org/docs/)** — Media server for local content
- **[Nextcloud](https://docs.nextcloud.com/)** — Self-hosted cloud storage and calendar
- **[n8n](https://docs.n8n.io/)** — Automation platform similar to Zapier or Make
- **[cAdvisor](https://github.com/google/cadvisor)** — Container-level resource usage and metrics

Each container is mapped to a directory under `/mnt/media` (a bind mount from host), e.g.:
```yaml
volumes:
  - /mnt/media/jellyfin:/config
  - /mnt/media/nextcloud:/var/www/html
```

---

## ⚙️ AdGuard Setup and DNS Conflicts

AdGuard Home runs in an LXC container and is my DNS filtering solution. The process was smooth until I encountered one classic Linux pitfall:

### Issue:
AdGuard wouldn't start because port 53 was already occupied by `systemd-resolved`.

### Fix:
```bash
sudo systemctl stop systemd-resolved
sudo systemctl disable systemd-resolved
```

Then restarted AdGuard:
```bash
sudo systemctl restart AdGuardHome
```

I also configured Proxmox and pfSense to use AdGuard as the primary DNS server.

➡️ [AdGuard Home Docs](https://github.com/AdguardTeam/AdGuardHome/wiki)

---

## 🧪 Common Pitfalls & Fixes

### 🚧 Jellyfin Chaos

Problems:
- Couldn’t log in even on a fresh install
- Web client missing error (`jellyfin-web`)
- Hanging boot times

Solution:
- Wiped old configs: `/mnt/media/jellyfin` and `.bak`
- Ensured correct permissions
- Ignored harmless log noise about web client if UI was working

### 💥 LXC Full Disk = No Service

When an LXC container ran out of space, it failed hard.

Fix:
```bash
pct resize 101 rootfs +10G
```
Bonus: wrote a cron script to auto-expand when disk free space < 1 GB.

### ❌ Port 53 Taken by systemd-resolved

AdGuard wouldn’t start. Why? Port 53 already used by `systemd-resolved`.

Fix:
```bash
sudo systemctl stop systemd-resolved
sudo systemctl disable systemd-resolved
```

### 🗂️ Samba Permissions

Initial Samba mount worked, but Jellyfin couldn’t read media files.

Fix:
```bash
mount -t cifs -o credentials=/etc/samba-credentials,file_mode=0777,dir_mode=0777 //server/share /mnt/sambashare
```

Also ensured UID/GID matched container permissions.

---

## 🔐 Tailscale = Instant VPN

MagicDNS + ZeroConfig = game changer.

- Remote access to Proxmox UI, AdGuard, SMB shares
- No port forwarding
- Works across devices

➡️ [Tailscale Docs](https://tailscale.com/kb/)

---

## 📊 Monitoring (Planned)

Coming soon:
- **Prometheus + Grafana** for full stack observability
- **node-exporter** on all VMs and LXC
- **cAdvisor** in Docker VM

➡️ [Grafana Docs](https://grafana.com/docs/)
➡️ [Prometheus Docs](https://prometheus.io/docs/)

---

## 💡 Key Takeaways

- Start small and iterate
- Separate responsibilities with LXC, VM, and Docker
- Expect to break things (then fix them)
- Automate disk management early
- Tailscale rocks

---

## 🔗 Next Steps & GitHub

Soon I’ll be publishing all YAMLs, Docker Compose files, and scripts used for:
- Auto-resizing LXC disks
- Monitoring setup
- Container deployment

👉 [matleszkiewicz.dev](https://matleszkiewicz.dev) | [GitHub](https://github.com/matleszkiewicz)

---

## 🧠 Meta Description

A hands-on walkthrough of building a self-hosted home lab using Proxmox, LXC, VMs, Docker, and Tailscale. Includes service architecture, DockerVM setup, common errors, and fixes. Great for learning system architecture and DevOps fundamentals.
