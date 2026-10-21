---
title: "Building My HomeLab: From Scratch to Self-Hosting"
date: 2025-07-23
layout: portfolio_article
project: "Homelab"
author_profile: true
read_time: true
share: true
related: true
tags: [Homelab, Self-Hosting, Proxmox, Virtualization, Projects]
---

I built this homelab to run the services I wanted at home—file storage, media, DNS filtering, automation, and remote access—without putting every workload directly on the hypervisor. **Proxmox VE** became the base, with separate VMs and an LXC container for different roles. This is a snapshot of the layout and troubleshooting I documented in 2025, not a claim that every component is still configured the same way today.

I have since written separate updates about how the lab changed. Those later posts are useful context, but I keep them separate here so the first version does not inherit services or fixes that came later.

## The first layout

The original design divided the jobs across the host, virtual machines, a container, and Docker:

```text
Proxmox VE host
├── pfSense VM          firewall, DHCP and NAT
├── TrueNAS VM          storage attached through a USB HDD enclosure
├── Ubuntu Docker VM
│   ├── Portainer       container management
│   ├── Jellyfin        media server
│   ├── Nextcloud       file sync and sharing
│   ├── n8n             workflow automation
│   └── cAdvisor        container metrics
├── AdGuard Home LXC    DNS filtering
├── Tailscale           host and LXC for remote access
└── Samba mount         storage path made available to workloads
```

The address shown in my original diagram was a private LAN address; I have removed it from this public version. The important part of the design is the separation of responsibilities. Proxmox managed the VMs and LXC; an Ubuntu VM ran Docker services; TrueNAS handled storage; and AdGuard provided DNS filtering. That kept Docker and its application containers off the Proxmox host itself.

The diagram is an overview, not a complete network or storage specification. It does not document the exact Proxmox resources, disk layout, backup policy, VLANs, or firewall rules, so I am not filling those gaps with guesses.

## A separate VM for Docker services

I used a dedicated Ubuntu VM as the Docker host. Portainer gave me a web interface to manage containers and volumes, while `htop` and cAdvisor helped inspect resource use. Jellyfin, Nextcloud, and n8n each had a clear application role, but the shared dependency was storage: the containers needed access to directories mounted under `/mnt/media`.

The original Compose example used bind mounts to connect host paths to container paths:

```yaml
volumes:
  - /mnt/media/jellyfin:/config
  - /mnt/media/nextcloud:/var/www/html
```

That made the data paths visible and reusable, but it also meant permissions crossed multiple layers: the SMB mount, the Docker VM, and the user IDs inside each container. A successful mount did not guarantee that Jellyfin could read the files. Matching ownership and mount options to the service was part of getting the stack working.

One early Samba example in my notes used `0777` client-side file and directory modes. I have removed that as an instruction: permissive modes are not a safe default, and local mount options do not replace the SMB server's own access controls. For a real mount, use the narrowest access needed, a protected credentials file, and ownership and modes that match the container. The [CIFS mount documentation](https://docs.kernel.org/admin-guide/cifs/usage.html) explains how client-side mount options interact with the SMB share's permissions.

## DNS and the port 53 conflict

AdGuard Home ran in an LXC container. It failed to start because `systemd-resolved` was already listening on DNS port 53. My original notes repeat this issue and show stopping and disabling `systemd-resolved`, then restarting AdGuard. They do not identify which machine owned that listener, so I cannot safely say whether those commands were run inside the LXC, another guest, or on the Proxmox host. The distinction matters: a DNS service must not be disabled on the wrong system.

That was the quick fix I recorded, but disabling a resolver without checking how the guest itself resolves names can break package installs and upstream DNS. I would first identify which process owns port 53 inside the correct guest, verify how that guest gets upstream DNS, and then choose a resolver configuration that leaves a working path. Afterward, test name resolution from the guest as well as from a client using AdGuard. I also configured Proxmox and pfSense to use AdGuard for DNS, so a failure in the DNS service affected more than its own LXC.

## The service errors were part of the build

Jellyfin was the least smooth part of the first setup. My notes list login trouble after a fresh install, a missing `jellyfin-web` message, and slow or hanging boots. They group together clearing old configuration data, correcting permissions, and ignoring the web-client message only when the UI was working, but do not tie each action to a particular symptom or establish one root cause. I would check the installed package and current logs before treating an error as harmless, and back up configuration before removing old state.

An LXC running out of disk space also interrupted services. I enlarged its root filesystem from the Proxmox host using `pct resize`; the documented syntax supports adding capacity with a `+` size. My original example used a specific container ID, which I have replaced with a placeholder:

```bash
pct resize <CTID> rootfs +10G
```

I also wrote a cron job to expand a container when free space dropped below 1 GB. The script was not published, so this is a record of what I tried rather than a ready-to-run automation recipe. Automatic expansion can hide a growing log or a runaway workload, and it still depends on free space in the backing storage. I would pair capacity alerts with a review of what is consuming disk and verify storage headroom before increasing a limit. See the [Proxmox `pct` manual](https://pve.proxmox.com/pve-docs/pct.1.html) for the current command syntax.

## Remote access without router port forwards

I installed Tailscale on the Proxmox host and in an LXC so I could reach selected services remotely without manually forwarding their ports on the router. Tailscale uses NAT traversal to connect devices where possible; connection behavior depends on the networks involved, as described in its [NAT traversal overview](https://tailscale.com/blog/how-nat-traversal-works). I used it as remote access to the lab, not as a reason to expose every service to every device. Access controls and service authentication still matter.

## What changed after this snapshot

The first article described cAdvisor but listed Prometheus and Grafana as future work. In February 2026, I documented a fuller observability stack: Prometheus for metrics, Loki for logs, Grafana dashboards, Node Exporter, cAdvisor, and Blackbox Exporter probes. I also described Netdata as the metrics path for TrueNAS. That was an evolution of the initial monitoring, not something already present in the original diagram. See [the observability write-up](/Homelab-Observability-Grafana-Stack/).

Other follow-ups show the same gradual expansion. I documented Nextcloud and Music Assistant service changes in [a later Docker update](/Homelab-Update-Nextcloud-Music-Assistant/), and in February 2026 wrote down a more deliberate storage and backup design using TrueNAS datasets, Proxmox Backup Server, Restic, Backrest, and off-site storage in [the backup strategy article](/Homelab-Backup-Strategy-321/). Some of that later plan was still pending at the time of writing; the linked post marks those parts explicitly.

## What I learned

Separating workloads made the system easier to understand, but it did not remove dependencies. Docker containers depended on the SMB mount and correct permissions; DNS filtering depended on a service owning port 53; and an LXC with no free space could take its service down. The failures were often at the boundaries between components, not in the headline application itself.

I also learned to distinguish a service running from a service being recoverable. The initial setup had useful apps and remote access, but the 2025 diagram did not yet describe the later backup strategy. Storage, monitoring, and backups needed their own design rather than being treated as checkboxes attached to the hypervisor.

This was the start of the lab, not its final architecture. The later write-ups document the pieces that changed and the issues I had to work through as I added services.

## References

- [Proxmox VE administration guide](https://pve.proxmox.com/pve-docs/pve-admin-guide.html)
- [Proxmox `pct` manual](https://pve.proxmox.com/pve-docs/pct.1.html)
- [Tailscale: How NAT traversal works](https://tailscale.com/blog/how-nat-traversal-works)
- [Linux CIFS usage documentation](https://docs.kernel.org/admin-guide/cifs/usage.html)
- [Jellyfin documentation](https://jellyfin.org/docs/)
- [AdGuard Home documentation](https://github.com/AdguardTeam/AdGuardHome/wiki)
