---
title: "Running a Private AI and SearXNG Stack in My Homelab"
date: 2026-10-17
layout: portfolio_article
author_profile: true
read_time: true
share: true
related: true
tags: [Homelab, Local AI, SearXNG, Open WebUI, llama.cpp, OpenCode, Networking]
description: "How I connected local GGUF models, Open WebUI, self-hosted SearXNG search, and GPU handoff controls in my homelab."
---

On October 17, 2026, I turned a collection of local AI experiments into a more usable stack. The result was not just a model running on a GPU. It was a private path from a chat interface to local inference, with web search supplied by my own SearXNG instance and a controller that gives Jellyfin priority when the same GPU is needed for transcoding.

The stack now has four important pieces:

- **llama.cpp**, running CUDA inference on an RTX 2000 Ada passed through to a GPU VM.
- **llama-swap**, which lets one backend expose several GGUF models while loading only one into VRAM at a time.
- **Open WebUI**, providing the browser interface, model presets, search tool and account-scoped memories.
- **SearXNG**, running on the Docker VM behind a separate VPN container and supplying search results without a third-party search API key.

I also connected the local OpenCode client to the authenticated OpenAI-compatible API. That gives me a local model option for coding and tool-use work without changing the default model for every OpenCode session.

![Open WebUI with the local Qwen3 14B model selected](/assets/images/open-webui-qwen3-14b.svg)

*Open WebUI showing the local Qwen3 14B model selected.*

## The architecture

The GPU VM owns inference. Open WebUI and llama-swap share a private Docker network, while the edge Caddy instance exposes the user-facing HTTPS routes only through the tailnet:

```text
Browser on tailnet
        |
        v
https://llm.<HOMELAB_DOMAIN>
        |
        v
Edge Caddy
        |
        v
Open WebUI
        |
        v
llama-swap -> llama.cpp -> RTX 2000 Ada
```

The model API has its own hostname and requires an API key. I kept the raw model backend on the LAN side instead of exposing it directly to the internet. Open WebUI connects to llama-swap through its internal Docker address, and trusted clients use the authenticated edge API when they need OpenAI-compatible endpoints.

SearXNG runs separately on the Docker VM:

```text
Open WebUI search tool
        |
        v
SearXNG JSON endpoint
        |
        v
SearXNG + gluetun VPN network namespace
        |
        v
Search engines through the VPN egress
```

The SearXNG container shares the gluetun network namespace. The VPN container publishes the search port, while SearXNG itself does not get a separate direct network path. That is useful for this workload: search requests leave through the VPN rather than the home ISP connection. If the VPN fails, searches should fail rather than silently switching to the normal home egress.

## Model selection without filling the GPU

The GPU has 16 GB of VRAM, so I did not try to keep every model loaded. llama-swap acts as the model switcher and starts a model only when a request needs it. The configured models are:

- **Qwen3-14B Q5_K_M** for general local chat.
- **Qwen3-14B abliterated Q5_K_M** as a separate selectable variant.
- **GPT-OSS-20B MXFP4** for coding and agent-style work.

Only one model is resident at a time. The Qwen models use a 16,384-token context configuration and have reasoning disabled by default. That choice matters for response time: the local documentation records roughly 15–20 seconds for a simple request when Qwen3 spends most of its generation in the thinking phase, compared with about 0.3 seconds for a simple response when thinking is disabled.

Reasoning remains available as an explicit Open WebUI preset. I created fast and reasoning presets rather than making every request pay the latency cost. The abliterated Qwen GGUF also needed the base Qwen chat template supplied explicitly because its file did not contain the `enable_thinking` branch used by the standard template.

GPT-OSS uses a different Harmony-compatible configuration. It runs with a 32,768-token context and automatic reasoning parsing instead of the Qwen-specific thinking flag. The model is loaded on demand. During testing it used about 11.6 GiB of VRAM, which left enough room for a Jellyfin transcode to begin before the GPU controller reclaimed the device.

I tested GPT-OSS through the API and Open WebUI, then used it for bounded OpenCode Plan and Build tool-use checks. Those tests passed. I did not make it the global OpenCode default; the model remains a selectable local provider instead.

## Open WebUI as the user-facing layer

Open WebUI stores the connection to llama-swap in its persistent data directory. The Compose environment points it at the internal OpenAI-compatible endpoint and disables the Ollama integration because this stack is not using Ollama's API shape. That distinction mattered when the model list appeared empty: the connection belonged under OpenAI API connections, not the Ollama settings.

The UI also provides account-scoped Memories. I enabled Memories and Memory System Context, then verified the lifecycle with a temporary entry: add it, confirm it can be used, delete it, and check that the memory store is empty again. I did not add personal facts to the deployed memory bank. Memory is useful for preferences and stable homelab context, but it should not become an unreviewed place for secrets or credentials.

## Search without a third-party API key

Open WebUI uses SearXNG's JSON search endpoint through its built-in `search_web` tool. The configuration selects `searxng` as the search engine and points the query URL at the local SearXNG service. The model can therefore request current web results from the chat interface while the search service remains self-hosted.

SearXNG itself runs behind gluetun using NordVPN OpenVPN. Its settings keep JSON output enabled because Open WebUI requests `format=json`. Some engines were disabled after they were consistently blocked or throttled from the shared VPN exit; SearXNG continues to use the remaining configured engines instead of treating every engine as equally reliable.

I also rebuilt the SearXNG image locally to add two selectable themes: Catppuccin Mocha and Matrix. The themes are installed into copies of the bundled Simple theme, so they survive the container build rather than being a browser-only stylesheet pasted into a running container. The choice is stored in the browser's SearXNG preferences cookie and does not change another user's theme.

The public tailnet route is protected by the existing edge Caddy setup. The wildcard certificate issue turned out to be more subtle than “the certificate exists”: one DNSExit download supplied only the leaf certificate, while strict clients also needed the issuer chain. The renewal helper now rebuilds and verifies the full chain before installing it. That fixed search access for a strict client that rejected the incomplete chain.

## GPU handoff for Jellyfin

The GPU is shared with Jellyfin, so an AI server cannot simply assume it owns the device. The controller watches Jellyfin server sessions and uses NVIDIA process state as a fallback. Direct Play and Direct Stream do not force an AI shutdown; actual GPU transcoding does.

The state machine is:

```text
LLM_READY
    |
    | Jellyfin transcode detected
    v
MEDIA_ACTIVE
    |
    | final transcode ends
    v
MEDIA_COOLDOWN -- transcode resumes --> MEDIA_ACTIVE
    |
    | no transcode for 10 minutes
    v
LLM_READY
```

When a transcode starts, the controller stops llama-swap so Jellyfin can claim the VRAM. The Open WebUI interface stays running, but model requests fail while the backend is unavailable. After the final transcode ends, the controller waits through a 600-second cooldown before starting llama-swap again. Models load lazily on the next request.

This is intentionally media-first. A long generation or coding request can be retried; delaying video playback is the worse tradeoff for this machine. A browser transcode validated the stop, cooldown and reload cycle. Apple TV and iPhone acceptance tests remained follow-up work, so I am not claiming client-independent playback validation yet.

## What I kept out of the first deployment

The local API is authenticated, but I did not enable llama.cpp shell tools, MCP execution, or unrestricted local-file access. A model that can call tools is useful, but a model with unrestricted access to the host would turn a convenient coding endpoint into a much larger security boundary.

Secrets stay outside Git: the service API keys, Open WebUI secret, VPN environment, and model data are stored on the target hosts. The repository contains examples and deployment notes, not those values. The edge is gated through Tailscale rather than a public Funnel route, while Funnel remains reserved for the separate n8n webhook proxy.

## Results and next steps

At the end of the build, Open WebUI, llama-swap, SearXNG and gluetun were healthy. SearXNG returned JSON results, Open WebUI's retrieval path returned results, GPT-OSS passed API/UI/tool-use checks, and the temporary memory entry was added and deleted successfully.

The remaining work is operational rather than architectural: verify web search through the browser UI end to end, add an alert when the SearXNG VPN tunnel is down, repeat the GPU handoff test after the llama-swap cutover, and run Apple TV/iPhone transcoding checks. I also want a documented key-rotation path for trusted service clients instead of making future users retrieve keys from root-only files by hand.

This stack gives me a private AI interface, current web search, local OpenCode models, and a clear priority rule for media playback. More importantly, each part has an explicit boundary: search goes through its own VPN namespace, model access uses API keys, the edge stays tailnet-only, and the GPU controller treats Jellyfin transcoding as the higher-priority workload.

## References

- [Open WebUI](https://docs.openwebui.com/)
- [SearXNG](https://docs.searxng.org/)
- [llama.cpp](https://github.com/ggml-org/llama.cpp)
- [llama-swap](https://github.com/mostlygeek/llama-swap)
- [OpenCode V2 providers and models](https://opencode.ai/v2/docs/providers)
- [Tailscale Serve](https://tailscale.com/docs/reference/tailscale-cli/serve)
- [Caddy automatic HTTPS](https://caddyserver.com/docs/automatic-https)
