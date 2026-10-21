---
title: "Turning a Raspberry Pi into an RTSP Streaming Server"
date: 2025-06-29
layout: portfolio_article
project: "Raspberry Pi"
author_profile: true
read_time: true
share: true
related: true
tags: [RaspberryPi, Networking, Linux, Projects]
description: "A practical Raspberry Pi RTSP camera experiment using v4l2rtspserver, V4L2, and VLC on a second computer."
---

I wanted to see whether a Raspberry Pi and its camera could act as a small network camera without replacing the Pi's operating system or building a larger surveillance stack. I installed `v4l2rtspserver`, pointed it at the camera's V4L2 device, and opened the resulting stream from VLC on another computer. In the [walkthrough video](https://youtu.be/OSKRHQbNqq0), the live picture appears in VLC with a slight delay. I did not measure latency, so this is a working demonstration rather than a claim about real-time performance.

The project was deliberately small: Raspberry Pi OS, a Raspberry Pi camera, one RTSP server process, and a client that can open an RTSP URL. The repository guide does not specify a Pi model or camera revision, so I have left those out rather than repeat unsupported hardware details from the earlier version of this post.

## Camera to RTSP client

The camera is exposed to Linux as a Video4Linux2 device, `/dev/video0`. `v4l2rtspserver` reads that device and serves the video over RTSP. VLC connects to the Pi over the network and requests the stream. RTSP is the session protocol clients use to control and receive the stream; the server handles the camera input and publishes the endpoint.

The example in my guide sets the stream to 640 by 480 at 15 frames per second and listens on port 8554:

```bash
v4l2rtspserver -W 640 -H 480 -F 15 -P 8554 /dev/video0
```

The server exposes the path `/unicast`, so a client on the same reachable network can open:

```text
rtsp://<raspberry-pi-ip>:8554/unicast
```

I tested the URL in VLC's network-stream dialog. The video walkthrough shows the camera image arriving on the client, and also notes a slight delay. The guide mentions that a phone with VLC can be another client, but I only describe the desktop VLC demonstration as verified in the recording.

## Installing the server

The repository's setup notes start with Raspberry Pi OS and an official Raspberry Pi camera. They enable the camera through `raspi-config`, then install the build dependencies and compile [mpromonet/v4l2rtspserver](https://github.com/mpromonet/v4l2rtspserver):

```bash
sudo apt-get install cmake liblog4cpp5-dev libv4l-dev git -y
git clone https://github.com/mpromonet/v4l2rtspserver.git
cd v4l2rtspserver
cmake .
make
sudo make install
```

Once installed, the command above starts the stream in the foreground. Keeping it running that way is enough for a test, but not convenient after a reboot. My guide also includes a systemd unit so the server can be enabled at startup. It edits the unit's `ExecStart` to use the same resolution, frame rate, port, and camera device, then enables it:

```bash
sudo systemctl enable v4l2rtspserver
sudo reboot
```

The instructions assume the unit file exists at `/lib/systemd/system/v4l2rtspserver.service`; that path and service setup are specific to the installation described in the guide. On a different Raspberry Pi OS release, I would first check where the package or install process places the unit and inspect its status rather than assume the same path.

## What worked and what I would add

The useful result was being able to keep a general-purpose Raspberry Pi OS installation and run the camera stream alongside other software. I did not need a dedicated camera operating system for this proof of concept. VLC provided a quick way to check the endpoint from another device, and the systemd step documents how I intended the server to start after reboot.

This was not a complete CCTV system. The repository does not configure recording, motion detection, access control, or encryption, and the demo does not measure throughput or latency. The RTSP URL has no authentication configured in the instructions, so I would keep the stream on a trusted network rather than expose the port directly to the internet. The earlier draft mentioned port forwarding, but the setup guide only demonstrates access by the Pi's network address; it does not document router forwarding.

If I extended it, I would add a deliberate access-control plan first, then investigate recording and event triggers. I would also replace the system-managed unit-file edit with a locally maintained service override and document how to check logs and restart the service. Those are follow-up ideas, not features implemented in this project.

## Source and demo

- [Setup guide and commands on GitHub](https://github.com/matlesz/RaspberryPi-RTSP-Server)
- [Video walkthrough](https://youtu.be/OSKRHQbNqq0)
- [Upstream `v4l2rtspserver`](https://github.com/mpromonet/v4l2rtspserver)
