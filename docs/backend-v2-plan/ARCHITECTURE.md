# Backend v2: Architecture Overview

This document outlines the architecture for the new SiteCraft backend. The system is designed to be modular, scalable, testable, and maintainable, following modern best practices.

## 1. Core Principles

- **Modularity:** Every distinct piece of functionality (authentication, billing, analysis) is separated into its own module with clear boundaries.
- **Scalability:** The system is built around a distributed job queue, allowing analysis tasks to be processed in parallel and scaled independently of the API.
- **Testability:** The code is structured to facilitate unit and integration testing at every level.
- **Data-Driven:** The analysis engine is driven by rules and standards defined in the database, not hard-coded in the application.

## 2. Code Structure

The backend codebase is organized into the following directories within `backend-v2/src/`:

```
/src
├── api/                  # API layer (Routes, Controllers, Middleware)
├── core/                 # Core business logic (Services)
│   ├── workers/
│   │   ├── accessibility/
│   │   │   ├── colorContrast.worker.ts
│   │   │   ├── aria.worker.ts
│   │   │   ├── keyboardFocus.worker.ts
│   │   │   └── formsAndLabels.worker.ts
│   │   │
│   │   ├── seo/
│   │   │   ├── technicalSeo.worker.ts      // For robots.txt, sitemaps, canonicals
│   │   │   ├── onPageContent.worker.ts     // For headers, meta tags, keyword analysis
│   │   │   └── structuredData.worker.ts    // For JSON-LD, Microdata, Schema.org
│   │   │
│   │   ├── performance/
│   │   │   ├── imageOptimization.worker.ts // For image sizes, formats, compression
│   │   │   ├── assetLoading.worker.ts      // For render-blocking CSS/JS, minification
│   │   │   └── coreWebVitals.worker.ts     // For LCP, CLS, TBT via Lighthouse
│   │   │
│   │   ├── fetcher.worker.ts               // Prerequisite: Fetches all site content
│   │   ├── master.worker.ts                // Orchestrator: Kicks off all other jobs
│   │   └── aiSummary.worker.ts
├── lib/                  # Shared libraries & external service clients
├── config/               # Environment configuration
├── db/                   # Database migrations and seeds
└── ...
```

## 3. Technology Stack

- **Language:** TypeScript
- **Runtime:** Node.js
- **Framework:** Express.js
- **Database:** PostgreSQL (managed by Supabase)
- **Job Queue:** BullMQ with Redis
- **Web Scraping/Automation:** Puppeteer
- **Accessibility Engine:** `axe-core`
- **Performance Engine:** Google Lighthouse API
- **Containerization:** Docker

## 4. Analysis Pipeline

The analysis process is a multi-stage, asynchronous pipeline orchestrated by the job queue:

1.  **API Request:** A user submits a URL to the API. The API creates an `analyses` record and immediately returns a `202 Accepted` response.
2.  **Master Worker:** A master job is enqueued. This worker's sole responsibility is to kick off the next stage.
3.  **Fetcher Worker:** The master worker enqueues a single `fetcher` job. This job downloads all the necessary assets (HTML, CSS, screenshots, `robots.txt`) from the target URL and saves them to Supabase Storage. This ensures all subsequent steps use the exact same source data.
4.  **Analyzer Workers:** Once the fetcher job is complete, the master worker enqueues all specialized analyzer jobs in parallel. These are small, single-purpose workers (e.g., `colorContrast.worker`, `technicalSeo.worker`) that read the pre-fetched assets from storage, perform their specific analysis, and write their findings to the database.
5.  **AI Summary Worker:** After all analyzer jobs for a given analysis have completed, a final `aiSummary` job is enqueued. It reads all the generated issues and uses an LLM to create a high-level summary.

This architecture ensures that the system is highly efficient, as I/O-bound tasks (fetching) and CPU-bound tasks (analysis) are separated and can be scaled independently.
