---
title: "Building Parallel CI/CD Pipelines with AWS at Fundrecs"
date: 2025-06-30
layout: single
author_profile: true
read_time: true
share: true
related: true
tags: ["CI/CD", AWS, DevOps]
---

During my software developer internship at **FundRecs**, I worked on two CI/CD pipelines for the Java-based Fusion application. The goal was to replace manual deployment steps with a version-controlled path from a Bitbucket change through an AWS build and into ECS. Alongside the pipelines, I worked on CloudFormation infrastructure and a Landingzone feature for sending application outputs to S3.

My public [CV](https://matleszkiewicz.dev/cv/) describes the internship as work on two AWS CI/CD pipelines and infrastructure for product features. The technical details below come from my project notes; the company repository and deployment environment are not linked here, so I’m keeping the walkthrough at the architecture level and leaving out account-specific configuration.

## From Bitbucket to ECS

The project used two parallel pipelines built with AWS CodePipeline. In each flow, a push to Bitbucket started the source stage. AWS CodeBuild handled the build work, including compiling the Java application and producing a Docker image. The deployment stage used CloudFormation to update the application running in ECS, with ECR providing the image reference.

That sequence connected a source change to a repeatable deployment process:

```text
Bitbucket push → CodePipeline → CodeBuild → container image → ECS deployment
```

The earlier process relied on manual deployment. Automating the handoffs meant the build and deployment steps could be represented in version-controlled infrastructure rather than repeated by hand. The notes describe two parallel pipelines, but do not document the exact difference between their triggers or targets; I have not guessed at that split here.

## CloudFormation as the infrastructure boundary

CloudFormation was used to describe both shared infrastructure and application resources. The project notes group the templates into three areas:

- Core infrastructure such as the VPC, IAM roles, and S3 buckets.
- Application resources such as the ECS service, task definitions, and ECR image references.
- The Landingzone storage module for application outputs.

Keeping those concerns in separate templates made the deployment easier to reason about: network and account resources were distinct from the service definition, and the storage integration had its own place. My CV records broader work creating CloudFormation scripts during the internship, while this article focuses on the infrastructure pieces relevant to the pipeline and Landingzone work.

## The Landingzone feature

Fusion needed a destination for processed outputs. The Landingzone work added an S3-backed storage path, with application code using the AWS SDK to route and timestamp files. That brought cloud storage into the application workflow rather than leaving it as a manual step after processing.

The earlier draft described this as an improvement to compliance and data governance. Those are reasonable goals for controlled storage, but the project notes do not provide a specific compliance control or validation result, so I am not claiming that the module itself established compliance. The useful technical point is narrower: the application could send its outputs to a configured S3 destination through AWS APIs.

## Delivery and security considerations

The notes describe the work across six weekly sprints: initial CloudFormation and ECS scaffolding, connecting Bitbucket to CodeBuild, automating Docker image creation, integrating Landingzone, then testing, logging, and documentation. That sequence shows how the infrastructure and application feature developed together instead of treating CI/CD as a separate final step.

Secrets and access were also part of the design. The project used AWS Secrets Manager for application credentials and IAM roles to control what build and deployment components could access. The original write-up called out least-privilege policies and isolated build environments. I have kept those at the design level here rather than publish secret names, policy documents, or environment details from a company system.

The main lesson for me was how many boundaries a deployment pipeline crosses: source control, build permissions, image storage, infrastructure changes, and a running service. CloudFormation and CodePipeline made those boundaries explicit, but they still needed careful permissions and a way to inspect failed builds or deployments. The project notes mention testing, logging, and debugging ECS tasks as part of the work; they do not include specific incident examples or measured deployment-time improvements.

## What I would extend

The original plan listed automated secret rotation, separate development/staging/production environments, deployment notifications, and broader Landingzone ingestion as future work. I would still start with environment separation and clear deployment feedback: those make it easier to validate a change before it reaches a production service. Secret rotation and additional ingestion paths would need to be designed around the application's actual credential and data requirements.

This internship project gave me practical experience connecting application delivery to AWS infrastructure. The important part was not just creating a pipeline, but making the build, image, deployment, storage, and permissions fit together as one system.
