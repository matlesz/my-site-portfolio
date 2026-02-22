---
title: "Homelab Backup Strategy: 3-2-1 with PBS, Restic, Backrest, and Jottacloud"
date: 2026-02-22
layout: single
author_profile: true
read_time: true
share: true
related: true
tags: [Homelab, Backup, Proxmox, TrueNAS, Restic, Jottacloud, RaspberryPi, Backrest]
description: "A deep dive into my 3-2-1 backup design for Proxmox and TrueNAS, with PBS for fast restores, restic for offsite, Backrest as the UI, and the gotchas that mattered in practice."
---

> "Homelab without a backup is a like a car witout a seatbelts, it is safe until the first crash."

This is the detailed write-up of the backup strategy I just implemented for my homelab. I wanted a 3-2-1 design, fast local restores, and offsite storage that stays lean. I also wanted a system I could explain to myself six months from now without rediscovering the same mistakes. This post captures the decisions, the stack, the final layout, and the real-world gotchas I hit while doing it.

Note: I do not include internal IPs, private hostnames, or Tailscale DNS names. I use placeholders like `<HOMELAB_DOMAIN>` and `<LAN_IP>` on purpose.

## Goals and constraints

The key goals were:

- 3-2-1 for critical data.
- Fast local restores for VMs and services.
- Offsite storage that is deduplicated and minimal.
- Avoid backing up re-downloadable media.
- Keep Nextcloud as the single source of truth for user files.
- Keep Time Machine local only.

The constraints were:

- I already had a single SMB share mounted on multiple hosts.
- I wanted to keep that share for convenience on Mac and iPhone.
- I wanted encryption at rest for all storage.

The biggest design choice was to split datasets for control and snapshots, but keep one SMB share so day-to-day usage stayed simple. The second big choice was deciding what *not* to back up. Movies and series are easy to re-download, and backups should be boring and small, so that content stayed onsite only.

## The final stack

**Primary storage and snapshots**
- TrueNAS with ZFS datasets and snapshots.
- ZFS native encryption with auto-unlock.

**VM backups**
- Proxmox Backup Server (PBS) running on Proxmox.
- PBS datastore on TrueNAS via NFS.
- Snapshot mode, nightly schedule, retention 7 daily / 4 weekly / 6 monthly.

**Offsite backups (Tier 1 only)**
- Restic + rclone to Jottacloud.
- Restic + SFTP to Raspberry Pi (planned, disk migration pending).

**Backup UI**
- Backrest on the Docker VM to manage restic schedules and check/prune jobs.

**Monitoring**
- Healthchecks.io for backup heartbeats.
- Planned: Uptime Kuma on EC2 for service uptime alerts.

## Data tiers

I split the backup scope into tiers so only the right data goes offsite.

**Tier 1 (3-2-1)**
- Nextcloud data
- Photos dataset (mounted into Nextcloud)
- Calibre library
- Nextcloud DB + config dumps
- n8n DB dumps
- Home Assistant backups
- Proxmox config exports
- `/opt` (filtered)

**Tier 2 (onsite only)**
- PBS datastore (VM/LXC backups)

**Tier 3 (onsite only)**
- Jellyfin media and downloads
- Time Machine backups

## Storage layout decisions

I kept a **single SMB share** for convenience but split the pool into **separate datasets** for control and policy.

Flattened layout under `/mnt/media`:

- `nextcloud/`
- `photos/`
- `calibre/`
- `jellyfin/movies/`
- `jellyfin/series/`
- `jellyfin/downloads/`
- `backups/` (nextcloud, n8n, ha, proxmox-config, pbs)
- `timemachine/` (separate SMB share)

Why this shape:

- Separate datasets allow different snapshot schedules and ZFS properties.
- Jellyfin and downloads stay in the **same dataset** to preserve hardlinks.
- Photos are a separate dataset but mounted into Nextcloud as external storage.
- Time Machine uses its own dataset and SMB share.

## Encryption approach

I use **ZFS native encryption** for all datasets. That protects against disk theft while staying transparent to apps. I did **not** enable Nextcloud server-side encryption for photos, because Immich would not be able to read encrypted files.

Auto-unlock is enabled for convenience. Keys are stored in 1Password.

## Backup flows

### Proxmox + PBS

- PBS runs as a VM on Proxmox.
- Datastore lives on TrueNAS via NFS.
- Proxmox backup job uses snapshot mode and excludes the TrueNAS VM.

This gives me one-click restores in Proxmox without offsite storage bloat.

### Restic (Backrest)

Backrest manages restic schedules to Jottacloud:

- Backup daily at 04:00
- Check weekly at 05:15 (5% read-data)
- Prune daily at 05:30

I disabled the systemd restic timers to avoid double runs. One scheduler is enough.

### App-level dumps

- Nextcloud DB + config tar goes to `/mnt/media/backups/nextcloud`.
- n8n DB dump goes to `/mnt/media/backups/n8n`.
- Home Assistant backups copied to `/mnt/media/backups/ha`.

These are small but critical and form the restore backbone.

## Observability

I use Healthchecks.io for backup heartbeats. Each job has its own URL so I can see failures and missed runs. For service uptime I will add Uptime Kuma on a small VPS later.

Homepage now links to Healthchecks and Backrest.

## Key gotchas and fixes

This is the part that saved me the most time. If you want to copy this setup, read this section first.

**1) PBS auth and datastore errors**
- Using `root@pbs` failed with 401. PBS expects `root@pam` or a local `@pbs` user.
- A trailing space in the datastore name caused `Cannot find datastore` errors.
- Datastore creation on NFS can take a long time. It looks stuck but is not.

**2) Rclone + Jottacloud**
- `trashed_only=true` made the repo invisible.
- A revoked token breaks updates silently. Regenerate the token and re-auth.
- Restic repo initialized with an empty password by accident; re-init fixed it.

**3) Backrest vs systemd**
- If Backrest manages restic schedules, systemd restic timers must be disabled.
- Backrest shows the restic password in JSON config; avoid sharing screenshots.

**4) Media path migration**
- Radarr/Sonarr hardlinks require downloads and library in the same dataset.
- Old `media/media` needed a rename after migration to prevent accidental use.

**5) Nextcloud maintenance**
- The LSIO Nextcloud container uses `occ` at `/app/www/public/occ` and user `abc`.
- If you use the wrong path, backups silently fail.

**6) Registry outages**
- Docker image pulls failed intermittently (ghcr.io, lscr.io, Docker Hub).
- Retrying later worked, but it looked like a broken config at first.

**7) RPi automation**
- Systemd units need `[Install]` sections or they cannot be enabled.
- Environment files should be optional to avoid service startup failures.

## Current status

- PBS backups are enabled and scheduled.
- Jottacloud restic is managed by Backrest and scheduled nightly.
- Healthchecks links are live on Homepage.
- RPi repo is planned and scripted; disk migration is pending.

## What I would do differently next time

- Set the restic password first and record it in a password manager.
- Use a dedicated PBS user from the start.
- Keep a single migration checklist to avoid missing path updates.

## Resources

These are the docs I used or wish I had open while doing this:

- [Proxmox Backup Server docs](https://pbs.proxmox.com/docs/)
- [Proxmox VE backup/restore docs](https://pve.proxmox.com/wiki/Backup_and_Restore)
- [Restic documentation](https://restic.readthedocs.io/en/stable/)
- [rclone Jottacloud backend](https://rclone.org/jottacloud/)
- [Backrest (restic UI)](https://github.com/garethgeorge/backrest)
- [Healthchecks docs](https://healthchecks.io/docs/)
- [TrueNAS SCALE docs](https://www.truenas.com/docs/scale/)
- [Jottacloud](https://www.jottacloud.com/)

## Final architecture (simplified)

```
TrueNAS (ZFS, encrypted, snapshots)
  |\
  | \__ PBS datastore (NFS) -> PBS -> Proxmox backups
  |
  \__ App data (SMB) -> restic (Backrest) -> Jottacloud
                                 \-> RPi (planned)
```

If you are building something similar, take the time to map your data tiers and storage layout first. Everything else becomes much easier once the data model is clean.
