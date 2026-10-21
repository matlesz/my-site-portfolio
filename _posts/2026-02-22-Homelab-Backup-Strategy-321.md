---
title: "Homelab Backup Strategy: 3-2-1 with PBS, Restic, Backrest, and Jottacloud"
date: 2026-02-22
layout: portfolio_article
author_profile: true
read_time: true
share: true
related: true
tags: [Homelab, Backup, Proxmox, TrueNAS, Restic, Jottacloud, RaspberryPi, Backrest]
description: "A deep dive into my 3-2-1 backup design for Proxmox and TrueNAS, with PBS for fast restores, restic for offsite, Backrest as the UI, and the gotchas that mattered in practice."
---

> “A homelab without a backup is like a car without a seatbelt: safe until the first crash.”

On February 22, 2026, I documented how I was backing up the important parts of my homelab. I wanted quick local VM restores, encrypted offsite copies for irreplaceable data, and a clear rule for what did not need to leave the house. The design used TrueNAS snapshots and a Proxmox Backup Server datastore, with Restic sending selected data to Jottacloud.

This was a design with working scheduled jobs, but not every part of the 3-2-1 plan was complete. The additional Raspberry Pi SFTP target was still waiting on a disk migration, and the PBS datastore shared the TrueNAS storage system with primary data. I describe those as gaps rather than count them as independent backup copies.

## Goals and constraints

I wanted fast local restores for VMs, offsite copies of critical files, encryption at rest, and a data set small enough to keep backup operations manageable. Nextcloud was the source of truth for user files. Time Machine stayed local, and I left Jellyfin movies, series, and downloads out of offsite backup because they could be reacquired.

I also wanted to keep using one regular SMB share from Macs and other devices. Under that share, I separated the data into TrueNAS datasets so snapshots and storage properties could be controlled separately. Time Machine used its own SMB share.

## The stack and its status

| Role | Component | Status in this February 22 snapshot |
| --- | --- | --- |
| Primary storage | TrueNAS, ZFS datasets and snapshots | In use |
| VM and LXC backups | PBS VM on Proxmox; datastore on TrueNAS over NFS | Nightly, snapshot mode; retention 7 daily / 4 weekly / 6 monthly |
| Offsite file backup | Restic through rclone to Jottacloud | Active for Tier 1 data, scheduled by Backrest |
| Second Restic target | SFTP repository on Raspberry Pi | Planned; disk migration pending |
| Backup scheduling and checks | Backrest | Managing Restic backup, check, and prune jobs |
| Backup heartbeat | Healthchecks.io | Active |
| Service uptime alerting | Uptime Kuma on EC2 | Planned |

The local PBS datastore gave me a Proxmox-integrated restore path, while Restic sent selected files offsite. There is an important failure-domain limitation: the primary datasets and PBS datastore both lived on the same TrueNAS system. That PBS copy is useful for local recovery, but it does not protect against losing the TrueNAS pool or host. Jottacloud was the active offsite copy; the Pi target had not been brought online yet.

I therefore treat this as a **3-2-1 design in progress**, not proof that every Tier 1 dataset already had three independent copies on two media with one offsite. ZFS snapshots are useful for rollback, but they share the storage pool and are not an independent backup. The article also does not record a full restore drill, so scheduled jobs should not be confused with tested recovery.

## Data tiers

I split the backup scope into tiers so only the right data goes offsite.

**Tier 1 (selected for offsite backup)**
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

I kept one regular SMB share for day-to-day files, but split the ZFS pool into **separate datasets** for snapshot and storage policy. Time Machine was the exception: it used its own dataset and a separate SMB share.

Flattened layout under `/mnt/media`:

- `nextcloud/`
- `photos/`
- `calibre/`
- `jellyfin/movies/`
- `jellyfin/series/`
- `jellyfin/downloads/`
- `backups/` (nextcloud, n8n, ha, proxmox-config, pbs)
- `timemachine/` (exported as its own SMB share)

Why this shape:

- Separate datasets allow different snapshot schedules and ZFS properties.
- Jellyfin and downloads stay in the **same dataset** to preserve hardlinks.
- Photos are a separate dataset but mounted into Nextcloud as external storage.
- The regular user-data share stays simple, while Time Machine has its own dataset and SMB share.

## Encryption approach

I use **ZFS native encryption** for all datasets. That protects against disk theft while staying transparent to apps. I did **not** enable Nextcloud server-side encryption for photos, because Immich would not be able to read encrypted files.

Auto-unlock is enabled for convenience. Keys are stored in 1Password.

## Backup flows

### Proxmox + PBS

- PBS runs as a VM on Proxmox.
- Datastore lives on TrueNAS via NFS.
- Proxmox backup job uses snapshot mode and excludes the TrueNAS VM.

This let me start a VM restore from the Proxmox interface without pulling the data back from cloud storage. I had the nightly jobs enabled, but this post does not record a full restore drill; I should treat the restore path as configured, not disaster-tested.

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
- Using `root@pbs` returned 401. The PBS client defaults to `root@pam`; other identities must exist in the realm named in the login, such as a configured user in the PBS realm. I needed to use an identity that actually existed rather than assume a `root@pbs` account.
- A trailing space in the datastore name caused `Cannot find datastore` errors. I re-entered the name carefully rather than changing the underlying storage.
- Creating the datastore on my NFS-backed path took long enough to look stuck. That is what happened in this setup, not a guarantee that a slow datastore task is healthy. Check the task log, storage responsiveness, and available space before retrying. The PBS documentation describes datastores as directories on a filesystem; verify current support and performance requirements before choosing a network-backed path.

**2) Rclone + Jottacloud**
- I had `trashed_only=true` in the remote settings, which made the normal repository contents invisible. That option is for listing items in the trash, not a general view of the remote.
- Jottacloud refresh-token handling caused an authentication failure after the token was revoked or reused. I had to reconnect the remote. Keep each active rclone installation's credentials under control and use rclone's reconnect flow when its logs report an invalid grant.
- I accidentally initialized a Restic repository with an empty password and recreated it. The notes do not say whether the old snapshots were retained, so I do not count that as a successful recovery. Restic requires the repository password to decrypt its data; current versions treat an empty-password repository as an explicit insecure mode. Set and store the password before initializing a repo, then verify that it can open and restore data.

**3) Backrest vs systemd**
- Backrest managed the Restic schedule, so I disabled the separate systemd Restic timers to avoid running two schedulers for the same repository.
- Backrest configuration or diagnostic exports may contain repository credentials. I keep those files and screenshots private and redact them before sharing.

**4) Media path migration**
- Radarr/Sonarr hardlinks require downloads and library files to be on the same filesystem. I kept those paths in the same dataset so they shared that filesystem.
- An old `media/media` path remained after migration, so I renamed it to avoid services using the wrong location.

**5) Nextcloud maintenance**
- In the LinuxServer image layout I used, `occ` was at `/app/www/public/occ` and ran as `abc`. Container paths can change; check the image documentation for the version you deploy.
- A backup that calls `occ` from the wrong path may fail. I added the path and user to the runbook rather than assuming the command worked.

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

- Use a dedicated PBS user from the start.
- Keep a single migration checklist to avoid missing path updates.
- Test restores on a schedule, including at least one offsite restore, instead of treating a green backup job as proof of recoverability.

## Resources

These are the docs I used or wish I had open while doing this:

- [Proxmox Backup Server storage and datastore docs](https://pbs.proxmox.com/docs/storage.html)
- [Proxmox Backup Server authentication realms](https://pbs.proxmox.com/docs/user-management.html#authentication-realms)
- [Proxmox Backup Server backup client](https://pbs.proxmox.com/docs/backup-client.html)
- [Proxmox VE backup/restore docs](https://pve.proxmox.com/wiki/Backup_and_Restore)
- [Restic documentation](https://restic.readthedocs.io/en/stable/)
- [Preparing a Restic repository](https://restic.readthedocs.io/en/stable/030_preparing_a_new_repo.html)
- [rclone Jottacloud backend](https://rclone.org/jottacloud/)
- [Backrest (restic UI)](https://github.com/garethgeorge/backrest)
- [Healthchecks docs](https://healthchecks.io/docs/)
- [TrueNAS SCALE docs](https://www.truenas.com/docs/scale/)
- [Jottacloud](https://www.jottacloud.com/)

## Architecture at the time of writing

```
TrueNAS (ZFS, encrypted, snapshots)
  |\
  | \__ PBS datastore (NFS) -> PBS -> Proxmox backups
  |
  \__ App data (SMB) -> restic (Backrest) -> Jottacloud
                                 \-> RPi (planned)
```

If you are building something similar, take the time to map your data tiers and storage layout first. Everything else becomes much easier once the data model is clean.
