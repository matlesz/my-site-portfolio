---
title: "Homelab Update: Nextcloud + Music Assistant with Tailscale"
date: 2026-02-01
layout: single
author_profile: true
read_time: true
share: true
related: true
tags: [Homelab, Nextcloud, Music Assistant, Tailscale, Docker]
description: "A hands-on recap of adding Nextcloud and Music Assistant to my Docker VM, the gotchas I hit, and how I fixed each one."
---

> "Every new service adds value. Every new service adds a new place to forget a setting."

Today’s session was a full-stack homelab sprint: **Nextcloud** for file sync, **Music Assistant** for media control, and a pile of Tailscale + SMB details that only surface once you actually ship. It started as “let’s add two services,” and ended with a surprisingly long list of tiny fixes that turned a shaky setup into something repeatable.

If you’ve ever clicked “Add service,” felt good for five minutes, then spent the next hour chasing port conflicts and permissions—you’ll relate.

Note: I’ve redacted Tailscale DNS names, IPs, and LAN IPs in this public post. Replace placeholders like `<TAILSCALE_HOST>` and `<DOCKERVM_LAN_IP>` with your own values.

---

## ✅ What I Shipped

### Music Assistant
- Deployed on the Docker VM, **host network** for discovery and playback.
- Media library via SMB: `/mnt/media/media/Music` (read-only).
- LAN UI: `http://<DOCKERVM_LAN_IP>:8095`.
- Tailscale access moved to **port `18095`** to avoid host-network conflicts.

The reason for host network: Music Assistant relies on discovery and multicast. It behaves better when it can see the LAN directly.

### Nextcloud
- Deployed on the Docker VM with **MariaDB + Redis**.
- Data directory: `/mnt/media/NextCloud` (CIFS mount).
- LAN UI: `https://<DOCKERVM_LAN_IP>:8081` (self-signed TLS).
- Tailscale HTTPS: `https://<TAILSCALE_HOST>:8081`.

I chose the LSIO image for clean PUID/PGID handling, which matters when the data directory lives on a CIFS mount.

### Operational improvements
- Added a **boot automation** systemd unit so containers start cleanly after reboot.
- Updated Homepage with **Music Assistant** and **Nextcloud**.
- Updated Home Assistant to **2026.1.3** to resolve Music Assistant integration mismatch.

The theme here: the services were easy; **the glue was the hard part**.

---

## 🧨 Gotchas (And Fixes That Actually Worked)

### 1) Music Assistant integration version mismatch
**Symptom:** "The Music Assistant server is not the correct version" in Home Assistant.

**Fix:** HA was too old. Updated Home Assistant to `2026.1.3` (backup created first). That pulled a newer `music-assistant-client` that matches MA’s API schema.

This is one of those “silent mismatch” failures—you can hit the MA UI fine, but the HA integration refuses to bind.

---

### 2) MA ↔ HA link 404 during OAuth callback
**Symptom:** Browser redirected to `http://<DOCKERVM_LAN_IP>:8095/auth/external/callback` with 404.

**Root cause:** I entered the **Music Assistant URL** instead of the **Home Assistant URL** during linking.

**Fix:** Use HA URL in MA’s prompt (e.g. `http://<HOME_ASSISTANT_LAN_IP>:8123`).

---

### 3) Nextcloud “Access through untrusted domain”
**Symptom:** Nextcloud refused access via `https://<TAILSCALE_HOST>:8081`.

**Fix:** Add Tailscale domain and IP to `trusted_domains` in `config.php`, then restart Nextcloud.

In practice, I also add LAN IP + hostname variants to avoid future “why is this blocked” surprises.

---

### 4) Nextcloud data directory “readable by other people”
**Symptom:** Nextcloud install blocked due to permissive CIFS mount permissions.

**Fix:** Update `/etc/fstab` to include `file_mode=0660,dir_mode=0770` and remount.

This is a CIFS quirk: `chmod` inside the mount won’t fix it. The mode comes from mount options.

Also required:
- `systemctl daemon-reload` after fstab edits.
- If remount complained “device busy,” unmount first: `umount -f /mnt/media` then `mount /mnt/media`.

---

### 5) Tailscale Serve stole my Docker ports
**Symptom:** Containers started but ports were dead locally; Docker logs showed port binding errors.

**Root cause:** `tailscale serve` had already bound host ports like `3000`, `8080`, `8081`, `5678`.

**Fix:** Disable Serve on those ports before container start, then re-enable after Docker publishes ports. Also switched the startup script to use `docker compose up -d --force-recreate` so ports are always re‑published.

If Docker can’t bind a port at boot, the container may appear “up” but won’t actually be reachable. I now treat port conflicts as a first‑class boot concern.

---

### 6) Music Assistant + Tailscale Serve conflict
**Symptom:** MA uses host networking; Serve on `8095` conflicts with that port.

**Fix:** Proxy MA via Tailscale on **`18095`**, which forwards to `127.0.0.1:8095`.

That keeps MA’s host network intact while still giving me clean remote access.

---

## 🛠️ Commands That Saved Me

```bash
# Quick restart of the Nextcloud stack
docker compose --env-file /opt/nextcloud/.env -f /opt/nextcloud/docker-compose.yml up -d

# Disable/enable Tailscale Serve ports
tailscale serve --https=8081 off
tailscale serve --bg --https=8081 --yes https+insecure://127.0.0.1:8081

# Verify Nextcloud data perms
stat -c "%a %n" /mnt/media/NextCloud
```

I keep these in my runbook now because I hit the same pitfalls more than once.

---

## ✅ Current Access Points

- Music Assistant (LAN): `http://<DOCKERVM_LAN_IP>:8095`
- Music Assistant (Tailscale): `https://<TAILSCALE_HOST>:18095`
- Nextcloud (LAN): `https://<DOCKERVM_LAN_IP>:8081`
- Nextcloud (Tailscale): `https://<TAILSCALE_HOST>:8081`

---

## 🔜 Next Up

- Finish Nextcloud setup wizard and enable Redis file locking.
- Add MA + Nextcloud widgets to Homepage.
- Optional: move MA off host network and into a dedicated port map if needed.

---

## ✅ Pro Tip: Make Reboots Boring

After a VM reboot, services may start in the wrong order. The fix is a **boot automation** script that:
- waits for Docker
- ensures `/mnt/media` is mounted and responsive
- disables Tailscale Serve temporarily (so Docker can bind ports)
- uses `docker compose up -d --force-recreate` to restore port publishing
- re‑enables Serve after everything is up

This single change turned “every reboot is a fire drill” into “everything just comes back.”

---

## 🔗 References

- [Music Assistant documentation](https://music-assistant.io/)
- [Home Assistant: Music Assistant integration](https://www.home-assistant.io/integrations/music_assistant/)
- [LinuxServer Nextcloud image](https://docs.linuxserver.io/images/docker-nextcloud/)
- [Nextcloud trusted domains](https://docs.nextcloud.com/server/latest/admin_manual/configuration_server/config_sample_php_parameters.html#trusted-domains)
- [Nextcloud reverse proxy guidance](https://docs.nextcloud.com/server/latest/admin_manual/configuration_server/reverse_proxy_configuration.html)
- [Tailscale Serve docs](https://tailscale.com/kb/1112/serve)
- [Docker Compose reference](https://docs.docker.com/compose/)
- [mount.cifs manual](https://man7.org/linux/man-pages/man8/mount.cifs.8.html)

---

## 🧠 Meta Description

Today’s homelab sprint added Nextcloud and Music Assistant on Docker with Tailscale access, plus a full list of real-world gotchas and fixes: version mismatches, untrusted domains, CIFS permissions, and port conflicts.
