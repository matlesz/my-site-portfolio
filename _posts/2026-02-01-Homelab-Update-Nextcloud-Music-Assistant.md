---
title: "Homelab Update: Nextcloud + Music Assistant with Tailscale"
date: 2026-02-01
layout: portfolio_article
project: "Homelab"
author_profile: true
read_time: true
share: true
related: true
tags: [Homelab, Nextcloud, Music Assistant, Tailscale, Docker]
description: "A hands-on recap of adding Nextcloud and Music Assistant to my Docker VM, the gotchas I hit, and how I fixed each one."
---

> “Every new service adds value. Every new service adds a new place to forget a setting.”

On February 1, 2026, I added **Nextcloud** for file sync and **Music Assistant** for music playback to my Docker VM. The containers were only part of the work. Music Assistant needed to discover devices on the LAN, Nextcloud needed the right view of an SMB-backed data directory, and Tailscale Serve was competing with Docker for host ports during startup.

This is a dated account of that setup, not a current service inventory. I have kept private LAN addresses and tailnet names as placeholders. The exact Tailscale commands have also changed across client releases, so I describe the port arrangement and link to the current CLI documentation rather than presenting an old command block as a universal recipe.

## Two services, two network requirements

### Music Assistant: keep discovery on the LAN

I ran the Music Assistant server in Docker on the Ubuntu VM with host networking. Its music library came from an SMB-mounted directory and was mounted read-only into the container. The web interface was available on the local network on port `8095`.

Host networking was a deliberate choice. Music Assistant discovers and communicates with players using LAN protocols such as multicast DNS and UPnP. Its installation guide says the server and players need layer-2 network access; the Docker deployment uses host networking for this. I did not publish the music directory as a writable mount because the service only needed to read it.

For access over Tailscale, I used a different Serve port, `18095`, and forwarded it to the local Music Assistant web interface on `8095`. Keeping the tailnet-facing port separate made the intent clearer than asking the same host port to belong to both Docker and Serve. It did not change Music Assistant's LAN discovery requirement.

### Nextcloud: database, cache, and shared files

Nextcloud ran in a separate container with MariaDB and Redis. Its data directory lived on an SMB/CIFS mount. I used the LinuxServer image, which exposes `PUID` and `PGID` so the container's process can map to the intended host-side file ownership. That mapping matters when the data path is a network mount: the mount options, server-side SMB permissions, and container user IDs all affect whether Nextcloud can read and write files.

The service was available over HTTPS on the LAN using the image's self-signed certificate. I also configured a Tailscale Serve endpoint for remote tailnet access. Nextcloud rejected the tailnet hostname until I added that exact hostname to `trusted_domains` in `config.php`. This list controls which hostnames may be used to access the server; it is separate from `trusted_proxies`, which controls how Nextcloud handles proxy headers. I have not included the actual hostnames or IPs here.

The install also complained that its data directory was readable by other users. I adjusted the CIFS mount's `file_mode` and `dir_mode` and aligned the IDs used by the container. With CIFS, `chmod` from inside the container may not change the permissions presented by the mount. The `mount.cifs` documentation explains that client-side mode options depend on the negotiated Unix extensions and do not replace the SMB server's access controls.

## The Home Assistant integration needed a version match

The Music Assistant web interface was reachable, but Home Assistant reported that the server version was incompatible. I created a Home Assistant backup, then updated Home Assistant to `2026.1.3`. My notes record that this brought in a newer `music-assistant-client` and resolved the API-schema mismatch.

I hit a separate 404 during the external-account linking flow. I had entered the Music Assistant URL where the prompt expected the Home Assistant URL. Once I used the Home Assistant address, the callback went to the intended service. These were two different problems: one was a server/client version mismatch, the other was an incorrect URL in the integration setup.

## Docker and Tailscale Serve collided at boot

The most disruptive issue was a race over host ports. Tailscale Serve had configurations for ports that Docker Compose also tried to publish. After a VM reboot, containers could start while their expected host ports were unavailable. The Docker logs showed bind errors, so a container's “running” state alone did not prove the web interface was reachable.

There is an ambiguity in my original access-point notes: Nextcloud's LAN and tailnet URLs both use port `8081`, while the same post records a Serve/Docker conflict on that port. The notes do not prove that both endpoints were reachable at the same time, so I am not presenting that as a verified working layout. In a later [edge update](/Homelab-Update-Tailscale-Edge-Peer-Relay/), I documented moving internal HTTPS routing to Caddy rather than leaving Tailscale Serve bound to ports Docker needed.

My startup unit coordinated the sequence: wait for Docker and the SMB mount, temporarily remove conflicting Serve listeners, recreate the Compose projects so port publishing was restored, then bring the Serve endpoints back. This was my local workaround, not a portable systemd unit; I have not included the private script or host configuration. `docker compose up -d --force-recreate` recreates containers, so I treat it as a service operation that can interrupt workloads, not as a harmless status check.

In later notes, I kept the Music Assistant tailnet endpoint on `18095` while the service itself remained on `8095`. The current CLI form for that arrangement is:

```bash
tailscale serve --bg --https=18095 http://127.0.0.1:8095
tailscale serve status
```

This uses current documented syntax to illustrate the port mapping; it is not a verbatim copy of the command I ran at the time. Tailscale's CLI docs warn that Serve syntax changed in version 1.52; check the syntax and HTTPS requirements for the installed client. After a restart, verify both the Docker-published local port and the tailnet URL.

## The SMB unmount lesson

The Nextcloud setup depended on the SMB mount being available before its container started. An edit to `/etc/fstab` also required `systemctl daemon-reload` before I remounted. My old troubleshooting note suggested `umount -f` when the mount was busy. I have removed that as a recipe: a forced unmount can disrupt processes with files open on the share. Stop dependent containers first, identify what is holding the mount, and use a normal unmount when it is safe. If the share is not available during boot, the application should not be started against an empty local mountpoint.

## What I left for later

At the time of this update, I still needed to finish the Nextcloud setup wizard and enable Redis file locking. I also planned Homepage widgets for both services and considered moving Music Assistant away from host networking. The latter would trade away the straightforward LAN discovery path, so I would only change it after checking the device-discovery requirements.

The lesson from this build was that service configuration extends beyond the Compose file. A reliable startup depended on the order of the network mount, Docker, and Tailscale Serve; successful access depended on correct hostnames and permissions; and the Music Assistant integration depended on compatible versions. I documented those dependencies so the next reboot or upgrade would be easier to diagnose.

Later posts describe how the lab developed: [the observability stack](/Homelab-Observability-Grafana-Stack/), [the Tailscale edge update](/Homelab-Update-Tailscale-Edge-Peer-Relay/), and [the backup strategy](/Homelab-Backup-Strategy-321/). Those are subsequent snapshots and do not mean every planned item in this February 1 update was already complete.

## References

- [Music Assistant installation and networking](https://music-assistant.io/installation/)
- [Home Assistant Music Assistant integration](https://www.home-assistant.io/integrations/music_assistant/)
- [LinuxServer Nextcloud image](https://docs.linuxserver.io/images/docker-nextcloud/)
- [Nextcloud trusted domains](https://docs.nextcloud.com/server/latest/admin_manual/configuration_server/config_sample_php_parameters.html#trusted-domains)
- [Nextcloud reverse-proxy configuration](https://docs.nextcloud.com/server/latest/admin_manual/configuration_server/reverse_proxy_configuration.html)
- [Tailscale Serve CLI documentation](https://tailscale.com/docs/reference/tailscale-cli/serve)
- [Tailscale Serve overview](https://tailscale.com/docs/features/tailscale-serve)
- [`mount.cifs` manual](https://man7.org/linux/man-pages/man8/mount.cifs.8.html)
- [Docker Compose reference](https://docs.docker.com/compose/)
