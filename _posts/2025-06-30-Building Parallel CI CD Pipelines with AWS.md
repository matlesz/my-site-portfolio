---
title: Building Parallel CI/CD Pipelines with AWS at Fundrecs
date: 2025-06-30
tags: [CI/CD, AWS, DevOps]
layout: single
read_time: true
share: true
---

## 🧩 Project Overview

As part of my industry placement with **Fundrecs**, I was tasked with designing and implementing two parallel **CI/CD pipelines** to modernize the deployment of the company's Java-based Fusion application infrastructure. This effort involved the creation of reusable **CloudFormation templates**, seamless **Bitbucket integration**, and secure deployment workflows built entirely on **AWS services**.

---

## 🎯 Objectives

The core objectives of the project were:

- Design two **parallel CI/CD pipelines** using **AWS CodePipeline**
- Transition existing manual deployments into automated, version-controlled workflows
- Integrate with **Bitbucket** to trigger builds on push events
- Create secure and scalable **CloudFormation templates**
- Extend Fusion’s capabilities with a **Landingzone module** for cloud-based storage

---

## 🏗️ Infrastructure Design

### ☁️ CI/CD Pipeline Architecture

Each CI/CD pipeline includes:

- **Source stage**: Triggered by push events to a Bitbucket repository
- **Build stage**: Uses AWS CodeBuild to compile the Java app and create Docker images
- **Deploy stage**: Deploys to ECS using CloudFormation templates

We employed a **push-based trigger** to reduce latency and eliminate bottlenecks caused by waiting for PRs to be merged. The process results in an efficient, automated path from commit to deployment.

### 🔐 Security Design

- All secrets (MongoDB URI, Elastic APM tokens, etc.) are securely managed using **AWS Secrets Manager**
- IAM policies follow the **principle of least privilege**
- Build environments are isolated using distinct **roles and security groups**

---

## 🧪 CloudFormation Strategy

A modular approach to **Infrastructure as Code** (IaC) was used, consisting of:

- `core-infra.yaml`: VPC, IAM roles, S3 buckets
- `application.yaml`: ECS service, task definitions, ECR image references
- `landingzone.yaml`: Defines a secure S3-backed storage module for Fusion outputs

This setup enables rapid environment provisioning and clear separation of concerns between infrastructure components.

---

## 💡 The "Landingzone" Module

A critical innovation introduced during the project was the **Landingzone module** — a new component added to the Fusion tool that:

- Automatically stores processed data outputs to a secure S3 bucket
- Integrates with document and compliance workflows
- Uses AWS SDK calls within application logic to route and timestamp files

This significantly enhanced Fusion’s ability to meet data governance and cloud-first requirements.

---

## 📈 Development Process

The project was delivered over **six weekly sprints** using Agile methodology. Key sprint deliverables included:

- Sprint 1–2: CloudFormation core scaffolding + ECS setup
- Sprint 3: CI/CD pipeline linking Bitbucket to CodeBuild
- Sprint 4–5: Docker image automation + Landingzone integration
- Sprint 6: Testing, logging integration, and documentation

Code quality was maintained through peer reviews, static analysis, and isolated test deployments.

---

## 🧠 Key Learnings

Throughout this project, I developed strong hands-on experience in:

- Designing **production-ready CI/CD pipelines** with AWS
- Implementing **infrastructure-as-code (IaC)** using CloudFormation
- Managing **multi-service AWS deployments** with security best practices
- Debugging ECS task deployments, container failures, and IAM permission errors
- Understanding the full lifecycle of **secure DevOps in a real-world setting**

---

## 🚀 Future Directions

The groundwork laid by this project enables future improvements:

- Add **automated secret rotation**
- Support **multi-environment pipelines** (dev/stage/prod)
- Integrate with AWS EventBridge for Slack alerts
- Expand Landingzone to support real-time ingestion

---

## 🎓 Conclusion

This CI/CD infrastructure project was more than a technical implementation — it was a strategic shift in how software is built and deployed at Fundrecs. I’m proud to have delivered a robust, scalable, and maintainable DevOps solution that continues to support rapid product iteration and secure cloud-native practices.


---
*© 2025 Mat Leszkiewicz*