---
title: "Homelab Update: Tailscale Edge + Peer Relay Progress"
date: 2026-02-21
layout: single
author_profile: true
read_time: true
share: true
related: true
tags: [Homelab, Tailscale, Caddy, Networking, AWS, PlatformEngineering]
description: "A detailed walkthrough of my Tailscale edge migration, webhook isolation, and AWS peer relay setup, plus the gotchas that slowed me down."
---

> "The network is the product when the product is the network."

Today was a networking focused homelab sprint. I moved the edge toward a single Caddy entry point, kept webhooks safe, and finished a peer relay setup on AWS after an OCI attempt struggled with timeouts. This is the longer, more practical version of the story. It is the walkthrough I wish I had before I started.

Note: This post does not expose internal IPs, private hostnames, or Tailscale DNS names. I use placeholders like `<TAILNET_DOMAIN>` and `<HOMELAB_DOMAIN>` on purpose.

## Why I changed it

I wanted one consistent HTTPS entry point for every internal service instead of scattered Tailscale Serve configs. A free custom domain plus a wildcard SSL certificate keeps internal URLs clean and production-like without paying for per service certs. Centralizing routing reduces port conflicts and makes reboots less fragile. Webhooks still need public ingress, so Funnel stays, but only for a webhook-only proxy. Finally, a peer relay helps throughput when direct peer to peer connections are not available, which matters for streaming.

## Edge Caddy migration walkthrough

This is the path I took so far, with the steps that matter in practice.

1. Picking an internal domain and keeping it tailnet only. I use `https://<service>.<HOMELAB_DOMAIN>` for everything that should stay private.

2. Joining the edge node to the tailnet and capturing its tailnet IP. I bind the proxy to that interface so the LAN never sees it.

3. Adding a wildcard DNS record for `*.<HOMELAB_DOMAIN>` that points to the edge tailnet IP.

4. Issuing a wildcard certificate with ACME DNS 01. HTTP 01 cannot validate a tailnet only host, so DNS 01 is the reliable path.

5. Adding explicit routes in Caddy for each service and keeping them tailnet only.

Example Caddy site block with placeholders:

```bash
caddy

https://homeassistant.<HOMELAB_DOMAIN> {
    bind <EDGE_TAILNET_IP>
    reverse_proxy http://<LAN_SERVICE_HOST>:8123
}
```

If an upstream uses a self signed cert, add a transport block with `tls_insecure_skip_verify` in that site block. I keep those in a separate snippet to avoid repeating myself.

## Webhook ingress for n8n

The goal here is simple. Keep the n8n UI private, but still accept public webhooks.

**Step 1** Running a small webhook-only reverse proxy on dockervm.

**Step 2** Pointing Funnel at that proxy so only `/webhook` and `/webhook-test` are reachable.

**Step 3** Setting explicit base URLs in n8n so generated links and callbacks are correct.

Webhook-only proxy example:

```bash
caddy

:<WEBHOOK_PROXY_PORT> {
    @webhooks path /webhook/* /webhook-test/*
    reverse_proxy @webhooks <N8N_LOCAL_URL>
    respond 404
}
```

Funnel command:

```bash
tailscale funnel --https=443 --bg --yes http://localhost:<WEBHOOK_PROXY_PORT>
```

n8n environment:

```bash
env

N8N_EDITOR_BASE_URL=https://n8n.<HOMELAB_DOMAIN>
WEBHOOK_URL=https://<TAILNET_DOMAIN>
```

## Current architecture (simplified)

```
Internet (webhooks)
    |
    v
Tailscale Funnel
    |
    v
Webhook-only proxy
    |
    v
n8n

Tailnet clients
    |
    v
Edge Caddy
    |
    v
Internal services on LAN
```

## Peer relay, why and how

Tailscale peer relays are designed to improve performance when direct peer to peer links cannot be established. The Tailscale team explains the motivation and tradeoffs clearly in their peer relay launch post. The short version is that a well placed relay can offer lower latency and higher throughput than the default DERP fallback. That matters for sustained streams like Jellyfin. Here is the reference I used while planning the move: https://tailscale.com/blog/peer-relays-ga/

Here is how I set it up on AWS with Ubuntu 22.04 and no internal IPs.

**Step 1**
Launching an EC2 instance with a small Ubuntu image. I open TCP 22 and UDP 40000 in the security group.

**Step 2** 
Installing Tailscale and joining the tailnet with a tagged auth key.

**Step 3** 
Enabling the relay port and confirming that tailscaled is listening.

```bash
curl -fsSL https://tailscale.com/install.sh | sh
sudo systemctl enable --now tailscaled
sudo tailscale up --authkey=TSKEY-NEW --advertise-tags=tag:peer-relay
sudo tailscale set --relay-server-port=40000
```

Verification commands:

```bash
tailscale status
sudo ss -u -lpn | grep 40000
```

## Oracle Free Tier detour and why AWS was easier

I tried OCI first because the free tier is attractive. The reality was a string of timeouts, SSH sessions hanging during banner exchange, and repeated OOM kills while installing packages. I spent more time fighting the VM than working on the relay. That was the signal to stop.

AWS was the opposite. Ubuntu came up cleanly, the package install was stable, and the relay was listening on UDP 40000 within minutes. It cost a bit more, but it saved hours of uncertainty.

## How I validate it works

First I check that the relay port is open and tailscaled is listening. Then I run `tailscale ping --verbose <target>` from a client to see whether the path goes through a relay. Finally I stream a known Jellyfin title and compare startup time and buffering versus a direct path.

## Gotchas I hit and the fixes

Funnel hostnames are locked to `*.ts.net`, so the public webhook URL must stay on `<TAILNET_DOMAIN>`.

I only funnel the webhook proxy and keep everything else behind the edge.

Tailscale Serve can steal host ports before Docker binds them. 

The fix was to remove Serve bindings and let edge Caddy handle HTTPS, leaving only Funnel for webhooks.

Wildcard TLS needs DNS 01. HTTP 01 does not work for tailnet only hosts, so DNS 01 is the reliable path.

OCI had repeated timeouts and OOM kills, so I moved the relay to AWS to finish the setup.

## Results so far

- The edge migration path is clear and documented.
- Webhooks remain safe and isolated behind Funnel.
- The peer relay is live on AWS and ready for real world Jellyfin testing.

## Next up

- Tune Jellyfin streaming quality with real world relay data.

## References

- [Tailscale Serve](https://tailscale.com/kb/1112/serve), 
- [Tailscale Funnel](https://tailscale.com/kb/1223/funnel), 
- [Tailscale peer relays GA](https://tailscale.com/blog/peer-relays-ga/),
- [Caddy documentation](https://caddyserver.com/docs/)
- [ACME DNS 01 challenge](https://letsencrypt.org/docs/challenge-types/#dns-01-challenge),
- [Amazon EC2](https://aws.amazon.com/ec2/)

## Meta Description

This homelab update covers a detailed Tailscale edge migration, webhook isolation for n8n, and an AWS based peer relay setup, with practical steps, Oracle Free Tier lessons, and real world gotchas.
