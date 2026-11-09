---
title: "Building a Read-Only Homelab Inventory with NetBox"
date: 2026-11-09
layout: portfolio_article
project: "Homelab"
author_profile: true
read_time: true
share: true
related: true
tags: [Homelab, NetBox, Infrastructure, Inventory, Security]
description: "How I built a read-only NetBox inventory for Docker, Proxmox, and TrueNAS without giving collectors broad infrastructure control."
---

I wanted a reliable answer to a few basic homelab questions: where an application runs, which virtual machine hosts it, which IPs it uses, and which storage system it depends on. Those details were spread across Docker hosts, Proxmox, and TrueNAS, so answering them meant checking several systems by hand.

I built a self-hosted inventory around NetBox. It is exposed only through the trusted LAN and Tailnet, and it is populated by separate read-oriented collectors for Docker, Proxmox, and TrueNAS. The goal was to improve the inventory without giving an automation system broad control over the infrastructure.

## The architecture

The deployment uses dedicated PostgreSQL and Valkey services for NetBox. The collectors run as isolated Compose services with read-only filesystems, dropped Linux capabilities, and `no-new-privileges` enabled.

```text
Docker hosts ── GET-only Docker socket proxy ──┐
                                               │
Proxmox API ── PVEAuditor API token ───────────┼──> NetBox API
                                               │
TrueNAS API ── dedicated read-only API key ────┘
```

NetBox remains an inventory and relationship system. Prometheus continues to provide time-series monitoring and alerting; I did not try to make NetBox replace that role.

## Collecting Docker inventory

I deployed a separate collector on each Docker host. It reaches the Docker API through a GET-only socket proxy rather than receiving a general-purpose Docker socket. No Docker TCP socket is exposed.

The collector excludes container environment variables and arbitrary labels. It synchronizes Docker hosts and reachable application services every 15 minutes, while the proxy limits the operations available to the collector.

That separation matters because an inventory process does not need the ability to restart, remove, or recreate a container. It needs enough access to observe what is running and report it to NetBox.

## Representing Proxmox guests

The Proxmox collector represents nodes as NetBox devices and QEMU and LXC guests as virtual machines. Guests are linked to their Proxmox host device and cluster.

Where Proxmox exposes the information, the collector records guest CPU, memory, disk, status, bridge, VLAN, MAC address, and configured IP data. The homelab prefix and discovered guest addresses are represented in NetBox IPAM.

The Proxmox token uses the `PVEAuditor` role. Authentication was not enough by itself: the token also needed the right visibility for the objects the collector was expected to read. I corrected those permissions through read-only dry runs before importing guests.

## Hardware discovery without automatic cleanup

The Proxmox collector also reads host-level facts without changing the hypervisor:

- CPU model and core count;
- memory capacity;
- Proxmox and kernel versions;
- local disks and SMART health where available;
- PCI devices; and
- network interfaces.

TrueNAS discovery adds the TrueNAS version and hostname, storage pools, disks, interfaces, and SMB and NFS share inventory.

Hardware observations are deliberately conservative. The collectors enrich existing device records instead of automatically creating or deleting physical components that might need human review. A discovered device is useful evidence, but it is not always enough to decide that the inventory should be changed.

## Read-oriented security decisions

The important design choice was to make inventory automation read-oriented by construction:

- each system uses dedicated credentials for NetBox, Proxmox, Docker, and TrueNAS;
- the Proxmox token uses `PVEAuditor`;
- the Docker collector cannot mutate containers because it never receives a general-purpose Docker socket;
- source credentials stay in protected host files and are not committed;
- collectors do not delete records when a source temporarily misses an object; and
- NetBox remains separate from monitoring and alerting.

The missing-object rule is intentional. A temporary API failure or source-side gap should not turn into an automated deletion from the inventory. Stale data needs to be visible and reviewed rather than silently removed during a partial sync.

## Validation before live synchronization

I validated the deployment incrementally instead of enabling every collector at once:

1. NetBox health and its database backup were verified.
2. Docker collectors were dry-run tested before live synchronization.
3. Proxmox authentication and permissions were corrected through read-only dry runs before importing guests.
4. TrueNAS API version compatibility was tested before enabling its collector.
5. Each collector was run once live and then restarted on its 15-minute schedule.

The current inventory includes Docker services from two hosts, one Proxmox node with seven QEMU/LXC guests, and one TrueNAS system with its storage summary. Exact addresses, credentials, and private ingress details are intentionally left out of this public article.

## Lessons from the implementation

API authentication success does not guarantee object visibility. The Proxmox token format was valid, but privilege separation still had to be resolved before the collector could see everything it needed.

NetBox also validates relationships strictly. A VM host device must be assigned to the cluster before a VM can reference it. The collector therefore needs to work with the NetBox data model rather than treating every object as an independent record.

Permissions are granular as well. IPAM, virtual interfaces, and MAC addresses required explicit collector permissions beyond basic device access. Dry-run modes made those gaps visible without turning a permissions problem into an infrastructure change.

Hardware discovery is most useful when the inventory preserves source attribution and last-seen information alongside the observation. That gives me a way to distinguish a current fact from a record that simply has not been reviewed recently.

That is a better starting point for future automation than allowing an update or assistant workflow to infer infrastructure state from systems it can also change.
