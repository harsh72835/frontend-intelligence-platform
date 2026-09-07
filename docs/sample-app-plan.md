# Sample App Plan

## Purpose

This document defines the role of the sample app inside Frontend Intelligence Platform (FIP).

The sample app is not just a demo. It is an important part of making the platform testable, explainable, and portfolio-ready.

## Why A Sample App Matters

Without a sample app, the platform is harder to:

- test end to end
- demo visually
- generate realistic telemetry
- explain in interviews
- produce screenshots and case study assets

The sample app gives FIP a controlled frontend system that generates meaningful telemetry across multiple routes and interactions.

## Main Goals

The sample app should:

- integrate the browser SDK
- generate realistic route changes
- generate realistic API calls
- create different performance patterns intentionally
- create some controlled runtime errors
- help validate the dashboard views and regression logic

## Product Role

The sample app should serve as:

1. SDK integration target
2. local telemetry generator
3. demo environment
4. dashboard validation source
5. case study support artifact

## Recommended App Type

Build a small multi-route Next.js app or similar frontend with intentionally varied route behavior.

Recommended concept:

- a storefront or analytics-style app with multiple pages

Why:

- easy to create different loading and interaction patterns
- easy to simulate API latency
- easy to produce route-level differences in vitals

## Suggested Routes

The sample app should have routes that produce different kinds of frontend behavior.

### `/`

Purpose:

- healthy baseline route
- fast load
- minimal script cost

### `/products`

Purpose:

- moderate API fetching
- medium list rendering cost

### `/product/[id]`

Purpose:

- route-level variation
- image-heavy or data-heavy page

### `/checkout`

Purpose:

- interaction-heavy route
- useful for INP and API timing observation

### `/reports`

Purpose:

- intentionally CPU-heavier route
- useful for long-task generation and slower vitals

## Controlled Telemetry Scenarios

The sample app should intentionally generate different telemetry categories.

### Performance scenarios

- fast route load
- slow route load
- image-heavy rendering
- main-thread blocking route
- slower API route

### Error scenarios

- one route with occasional handled UI issue
- one route with controlled JS runtime error trigger
- one interaction causing unhandled rejection in test mode

### Navigation scenarios

- route-to-route transitions
- repeated visits to same route
- release comparison after changing route performance

## How To Simulate Performance Differences

Use safe and intentional simulation methods.

Examples:

- delayed mock API responses
- larger component trees on specific routes
- expensive client-side rendering on one route
- large image assets on one route
- artificial CPU work in a controlled demo-only path

Avoid random chaos. The telemetry should be intentional and explainable.

## SDK Validation Goals

The sample app should help verify:

- SDK initialization works
- Web Vitals are captured
- route changes are captured
- fetch/API timings are captured
- JS errors are captured
- long tasks are captured
- release metadata appears correctly in dashboard

## Demo Scenarios For Portfolio Use

The sample app should support simple demo narratives such as:

### Demo 1: Healthy baseline

- visit home page
- inspect healthy vitals in dashboard

### Demo 2: Slow route investigation

- visit reports page
- observe slower route metrics and long tasks

### Demo 3: Release regression

- deploy or simulate a new release with worse route behavior
- compare release summaries in dashboard

### Demo 4: CI budget failure

- increase synthetic load or bundle size
- run budget checker
- show CI failure output

## Recommended Location

Suggested monorepo location:

`apps/sample-app`

## Suggested Sample App Scope

Keep the app intentionally small.

Recommended V1 sample app scope:

- 4 to 5 routes
- mock API layer
- one or two charts/tables if needed
- one intentionally slow route
- one intentionally error-prone flow

This is enough to generate useful telemetry without becoming its own major product.

## Suggested Build Sequence

1. create simple multi-route app shell
2. integrate SDK init
3. add mock API calls
4. add route-specific behavior differences
5. add one slow route
6. add one controlled error flow
7. validate telemetry in ingestion and dashboard

## Anti-Goals

The sample app should not become:

- a second major product to maintain
- visually overdesigned at the cost of telemetry usefulness
- dependent on complex backend infrastructure

Its job is to generate meaningful frontend runtime behavior for FIP.

## Final Rule

Build the sample app to make the platform easier to prove, not to distract from the platform itself.
