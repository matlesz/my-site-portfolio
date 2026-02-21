---
title: "Homelab Update: Tailscale Edge + Peer Relay Progress"
date: 2026-02-21
layout: single
author_profile: true
read_time: true
share: true
related: true
tags: [Homelab, Tailscale, Caddy, Networking, OCI, PlatformEngineering]
description: "A walkthrough of today's Tailscale edge migration work and peer relay attempt, plus the gotchas that slowed me down."
---

> "The network is the product when the product is the network."

Today was a **networking-focused homelab sprint**: I pushed forward on the Tailscale edge migration, kept the webhook ingress safe, and started the OCI peer relay build. This post is a walkthrough of what changed and the real-world gotchas that surfaced.

Note: This post **does not expose internal IPs, private hostnames, or Tailscale DNS names**. I use placeholders like `<TAILNET_DOMAIN>` and `<HOMELAB_DOMAIN>` on purpose.

---

## 🤔 Why this change

- I want one consistent HTTPS entry point for every internal service, instead of per-service Tailscale Serve config.
- A free custom domain plus a wildcard SSL cert keeps internal URLs clean and production-like without paying for certs per service.
- Centralizing routing reduces port conflicts and makes reboots less fragile.
- Webhooks still need public ingress, so Funnel stays, but only for a webhook-only proxy.
- A peer relay improves throughput when direct peer-to-peer connections are not possible.

## ✅ What I Progressed Today

### 1) Edge Caddy tailnet migration (walkthrough)
Goal: centralize HTTPS on an edge node and route everything through a single Caddy instance.

Walkthrough:
- Confirmed the edge node plan and the custom domain pattern for internal services (`https://<service>.<HOMELAB_DOMAIN>`).
- Locked in a free custom domain for internal services and planned a wildcard DNS record.
- Validated the migration path: keep the current Tailscale Serve config on the Docker VM until edge cutover is complete.
- Documented the steps for wildcard TLS via DNS-01 so Caddy can terminate `*.<HOMELAB_DOMAIN>` cleanly.
- Updated internal docs to reflect the in-progress state (so future me doesn’t forget what’s live and what’s planned).

### 2) Webhook ingress stays on Funnel (for now)
I kept the webhook-only proxy behind Tailscale Funnel on `<TAILNET_DOMAIN>`. This lets public webhooks flow without exposing the main app UI.

### 3) OCI peer relay build (in progress)
I created the OCI Free Tier VM and opened the relay port, but SSH connections are **hanging during banner exchange**. The instance also got stuck in a “Stopping” state in the console. That blocks the relay setup until the VM stabilizes or gets rebuilt.

---

## 🔧 Setup details (high level)

1) **Free domain + DNS**
   - Registered a free domain for internal services.
   - Pointed a wildcard record (`*.<HOMELAB_DOMAIN>`) at the tailnet edge address.

2) **Edge node**
   - Joined the edge host to the tailnet.
   - Installed Caddy and bound it to the tailnet interface (not `0.0.0.0`).

3) **Wildcard SSL cert**
   - Issued a wildcard certificate using ACME DNS-01.
   - Stored the cert/key on the edge host and referenced them in the Caddy config.

4) **Caddy routing**
   - Added reverse-proxy routes for each internal service:
     `https://<service>.<HOMELAB_DOMAIN> -> <LAN_SERVICE_URL>`.

5) **Keep Serve during migration**
   - Left existing Tailscale Serve entries in place until edge cutover is complete.

6) **Webhook-only ingress**
   - Funnel stays on `<TAILNET_DOMAIN>` and targets a proxy that only allows webhook paths.

---

## 🔌 n8n + webhooks (detail)

The goal is simple: **keep the n8n UI private**, but still accept public webhooks.

- Internal UI: `https://n8n.<HOMELAB_DOMAIN>` (tailnet-only)
- Public webhooks: `https://<TAILNET_DOMAIN>/webhook/*`

I use a webhook-only reverse proxy so Funnel never exposes the full n8n UI:

```caddy
:<WEBHOOK_PROXY_PORT> {
    @webhooks path /webhook/* /webhook-test/*
    reverse_proxy @webhooks <N8N_LOCAL_URL>
    respond 404
}
```

Then Funnel only points at that proxy:

```bash
tailscale funnel --https=443 --bg --yes http://localhost:<WEBHOOK_PROXY_PORT>
```

Finally, n8n gets explicit base URLs so links and callbacks are correct:

```env
N8N_EDITOR_BASE_URL=https://n8n.<HOMELAB_DOMAIN>
WEBHOOK_URL=https://<TAILNET_DOMAIN>
```

---

## 🧭 Current Architecture (Simplified)

```
      Internet (webhooks)
             |
             v
      Tailscale Funnel
             |
      webhook-only proxy
             |
             v
           n8n

   Tailnet clients
         |
         v
   Edge Caddy (in progress)
         |
         v
   Internal services on LAN
```

---

## 🧨 Gotchas (And What Actually Helped)

### 1) Funnel hostnames are locked to `*.ts.net`
**Gotcha:** Funnel doesn’t support custom domains. You can’t funnel traffic through `<HOMELAB_DOMAIN>`.

**What helped:** Accept Funnel on `<TAILNET_DOMAIN>` and route only webhooks through it, while everything else lives behind edge Caddy.

---

### 2) Tailscale Serve can steal host ports
**Gotcha:** Serve can bind ports before Docker does, which makes containers look “up” but unreachable.

**What helped:** Keep Serve active only where it’s needed and leave edge cutover for later. I also keep a boot workflow that temporarily disables Serve during container startup.

---

### 3) Wildcard TLS needs DNS-01
**Gotcha:** If you want `*. <HOMELAB_DOMAIN>` certificates for a tailnet-only host, HTTP-01 won’t work.

**What helped:** Use DNS-01 with an API-capable DNS provider and let Caddy load the cert files directly.

---

### 4) Caddy should bind to the tailnet interface
**Gotcha:** Binding to `0.0.0.0` exposes the edge proxy on the LAN, which I don’t want.

**What helped:** Bind Caddy explicitly to the tailnet interface IP and keep the service tailnet-only.

---

### 5) OCI VM stuck in “Stopping” state
**Gotcha:** The VM won’t complete stop/start cycles and SSH hangs during banner exchange.

**What helped:** Documenting the state and preparing a fallback plan to rebuild the VM if it doesn’t recover. Sometimes the fastest fix is a clean rebuild.

---

## ✅ Results So Far

- The edge migration path is clear and documented.
- Webhooks remain safe and isolated behind Funnel.
- The peer relay plan is in place, with a known blocker tracked for recovery.

---

## 🔜 Next Up

- Finish edge cutover and remove per-service Tailscale Serve on the Docker VM.
- Re-attempt OCI peer relay once the VM is stable (or rebuild if needed).
- Validate that all tailnet HTTPS routes resolve correctly post-migration.

---

## 📚 References

- [Tailscale Serve](https://tailscale.com/kb/1112/serve)
- [Tailscale Funnel](https://tailscale.com/kb/1223/funnel)
- [Caddy docs](https://caddyserver.com/docs/)
- [ACME DNS-01 challenge](https://letsencrypt.org/docs/challenge-types/#dns-01-challenge)
- [Oracle Cloud Free Tier](https://www.oracle.com/cloud/free/)

---

## 🧠 Meta Description

Today’s homelab update focuses on the Tailscale edge migration and an OCI peer relay attempt. This walkthrough captures the steps taken, the gotchas encountered, and what’s next.
