---
title: "Homelab Update: Tailscale Edge + Peer Relay Progress"
date: 2026-02-21
layout: portfolio_article
author_profile: true
read_time: true
share: true
related: true
tags: [Homelab, Tailscale, Caddy, Networking, AWS, PlatformEngineering]
description: "A detailed walkthrough of my Tailscale edge migration, webhook isolation, and AWS peer relay setup, plus the gotchas that slowed me down."
---

> “The network is the product when the product is the network.”

On February 21, 2026, I worked on three related network changes: bringing internal HTTPS routing toward a single Caddy edge, exposing only n8n webhook paths through Tailscale Funnel, and setting up an AWS peer relay. The edge and webhook work was a migration in progress. I configured the relay node, but real Jellyfin streaming tests were still on my list, so I do not claim a measured throughput improvement.

## One private HTTPS entry point

I wanted a consistent URL pattern for services that should only be reachable from my tailnet, instead of configuring Tailscale Serve separately on each service host. The plan was to run Caddy on an edge node joined to Tailscale, bind Caddy to that node's tailnet address, and proxy requests to services on the LAN. The private names and addresses remain placeholders here.

The Caddy site block in my notes shows the routing shape:

```caddyfile
https://homeassistant.<HOMELAB_DOMAIN> {
    bind <EDGE_TAILNET_IP>
    reverse_proxy http://<LAN_SERVICE_HOST>:8123
}
```

That is a route example, not a complete certificate configuration. The February migration plan used `acme.sh` with DNS-01 to issue the wildcard certificate, then configured Caddy to load the certificate and key from files. Let’s Encrypt’s DNS-01 challenge can validate a public domain without exposing the web server publicly, and it is required for wildcard certificates. The domain must be one I control through a DNS provider that supports the required TXT updates. Keep the provider credential narrowly scoped and outside Git; the actual certificate and key paths are intentionally omitted here.

The original notes suggested disabling upstream certificate verification for a self-signed backend. That bypasses an important TLS check and is not a safe default. For a lasting setup, configure Caddy to trust the internal CA or use a valid certificate rather than leave verification disabled. I have not included the bypass configuration as a recipe.

## Public webhooks, private n8n UI

n8n needed to receive callbacks from services on the public internet, but I did not want its editor UI publicly reachable. I put a small Caddy proxy in front of n8n and routed Tailscale Funnel to that proxy. The proxy was intended to pass only the webhook paths and return 404 for everything else:

```caddyfile
:<WEBHOOK_PROXY_PORT> {
    @webhooks path /webhook /webhook/* /webhook-test /webhook-test/*
    reverse_proxy @webhooks <N8N_LOCAL_URL>
    respond 404
}
```

The Funnel target in my notes was the proxy on the local machine, with HTTPS on port 443:

```bash
tailscale funnel --https=443 --bg http://127.0.0.1:<WEBHOOK_PROXY_PORT>
```

Funnel makes that endpoint reachable from the public internet. The Caddy path filter limits which n8n routes it forwards, but it does not authenticate webhook requests. Each workflow still needs whatever request verification, credentials, or signatures are appropriate for the service calling it. I kept the editor URL on the private side and set explicit n8n editor and webhook base URLs so generated links used the intended destinations.

The tracked February proxy used Docker host networking and Caddy listened on `:8088`, while Funnel forwarded to `127.0.0.1:8088`. That means the local Funnel target was correct, but the proxy port was not automatically loopback-only. A firewall rule was needed to prevent LAN clients from bypassing the intended public path filter. Treat a host-networked listener as reachable until the firewall configuration proves otherwise.

The commands and environment variable names in the original notes reflect the versions I was using then. Current n8n documentation deprecates `WEBHOOK_URL` in favor of `N8N_WEBHOOK_URL` in newer releases and calls for `N8N_PROXY_HOPS` when running behind a reverse proxy. Tailscale also changed Serve and Funnel CLI syntax in client version 1.52; check the docs for the installed version before copying old configuration.

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

## A peer relay for connections that cannot go direct

Tailscale first tries to establish a direct device-to-device connection. If that fails, it can relay traffic through a peer relay in the same tailnet, and use DERP when no suitable peer relay is available. A peer relay can perform better than DERP for some paths, but it adds a hop and is not faster than a direct connection by definition. Tailscale announced peer relays generally available on February 18, three days before this post. I wanted to test it for longer Jellyfin streams, not assume the benefit in advance.

I set up a small EC2 instance running Ubuntu 22.04 and configured Tailscale to listen for relay traffic on UDP port `40000`. The security group needed that UDP port reachable by intended peers. I also enabled SSH for administration; that inbound rule should be limited to an administrator source rather than opened broadly.

I joined the instance to my tailnet using a tagged auth key, then configured its relay port. I am not including the enrollment key or a command that could expose it in shell history. The relay-port setting itself looks like this:

```bash
sudo tailscale set --relay-server-port=40000
```

Configuring the node is only one part of enabling a peer relay. Tailscale's current documentation also requires an access-policy grant using `tailscale.com/cap/relay` for the devices allowed to use it. I did not include that policy in the original notes, so this article is not a complete copy-and-paste deployment guide.

I used status and socket checks to inspect the relay setup:

```bash
tailscale status
sudo ss -u -lpn | grep 40000
```

Those checks show the daemon and UDP listener state, but they do not prove another peer selected the relay. The validation step I still had planned was to use `tailscale ping --verbose <target>` and look for a `peer-relay` path, then stream a known Jellyfin title and compare it with a direct connection. The post does not contain those results, so I cannot claim the relay improved playback.

## The OCI detour

I tried Oracle Cloud Infrastructure first because its free tier looked attractive. In that attempt, SSH sessions repeatedly stalled during the banner exchange, package installation hit out-of-memory kills, and I spent more time getting a usable VM than configuring the relay. I stopped that attempt and used an AWS EC2 instance instead. The Ubuntu VM came up and installed the required packages reliably for me; that is what happened in this project, not a general comparison of the two cloud providers.

## Results so far

- I had a Caddy-based path documented for internal HTTPS, but this post does not prove that every service had migrated.
- Funnel was configured to point at a webhook-only proxy. That limits routed paths; the endpoints still need appropriate n8n request validation.
- The peer relay node was configured on AWS, but I had not yet verified that a client used it or compared Jellyfin playback.

## Current documentation notes

Tailscale's current peer-relay docs require more than setting a UDP port: a tailnet grant must allow the intended devices to use the `tailscale.com/cap/relay` capability. My original article does not include that policy, so readers should not treat its setup steps alone as a complete deployment. Peer-relay status should be checked from a client, not inferred from an open UDP listener.

The public webhook design also needs to be treated as public ingress. Funnel forwards requests from the internet to the configured target; routing only `/webhook` and `/webhook-test` does not authenticate the caller. Keep n8n's editor private and use per-workflow credentials or signature validation where the source supports it.

Current Caddy docs confirm wildcard certificates require DNS-01 plus a DNS provider module. They also warn that `insecure_skip_verify` disables upstream TLS verification. I have described both as constraints rather than recommendations because my source notes do not document the provider-specific DNS setup or a trusted internal CA.

n8n's current reverse-proxy docs use `N8N_WEBHOOK_URL` (with `N8N_PROXY_HOPS`) instead of the older `WEBHOOK_URL` in newer releases. Check the documentation for the n8n version you run before applying this older configuration.

## References

- [Tailscale Peer Relays documentation](https://tailscale.com/docs/features/peer-relay/)
- [Tailscale Peer Relays GA announcement](https://tailscale.com/blog/peer-relays-ga/)
- [Tailscale connection types](https://tailscale.com/docs/reference/connection-types)
- [Tailscale Funnel](https://tailscale.com/docs/features/tailscale-funnel)
- [Tailscale Funnel CLI](https://tailscale.com/docs/reference/tailscale-cli/funnel)
- [Tailscale Serve CLI](https://tailscale.com/docs/reference/tailscale-cli/serve)
- [Caddy automatic HTTPS](https://caddyserver.com/docs/automatic-https)
- [Caddy TLS DNS challenge](https://caddyserver.com/docs/caddyfile/directives/tls#dns-challenge)
- [Let's Encrypt challenge types](https://letsencrypt.org/docs/challenge-types/)
- [n8n webhook URLs behind a reverse proxy](https://docs.n8n.io/hosting/configuration/configuration-examples/configure-webhook-urls-with-reverse-proxy/)
- [AWS security group rules](https://docs.aws.amazon.com/vpc/latest/userguide/security-group-rules.html)
