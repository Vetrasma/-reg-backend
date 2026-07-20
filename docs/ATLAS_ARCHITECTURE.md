# ATLAS — Global Strategic Intelligence Operating System

## 1. Mission

ATLAS is a strategic intelligence operating system, not a chatbot. Its mission is to observe the world, understand it, discover hidden relationships, detect recurring patterns, explain causes, identify vulnerabilities, simulate possible futures, and discover opportunities before they become obvious.

## 2. Repository Structure

The production repository should evolve toward this layout:

```text
/apps
  /api-gateway
  /admin-console
  /graph-explorer
  /intelligence-workbench
/services
  /identity-access
  /source-ingestion
  /entity-resolution
  /knowledge-graph
  /economy-engine
  /company-engine
  /ai-engine
  /human-engine
  /pattern-engine
  /causal-engine
  /vulnerability-engine
  /opportunity-engine
  /future-engine
  /explainability-engine
  /notification-engine
/packages
  /domain
  /events
  /schemas
  /observability
  /security
  /testing
/infra
  /docker
  /kubernetes
  /terraform
  /helm
/docs
  /architecture
  /api
  /schemas
  /runbooks
  /adr
```

This patch introduces the first executable blueprint in `src/atlas/blueprint.js` and exposes it from the existing backend.

## 3. Architecture Style

ATLAS uses Clean Architecture, Domain-Driven Design, CQRS, event-driven processing, and selective microservices. Domain models and events are stable contracts; infrastructure adapters for PostgreSQL, Neo4j, Redis, Kafka, DuckDB, search, and vector databases remain replaceable.

## 4. Core Domain Model

### Entity

Every observable object is an `Entity`.

| Field | Purpose |
| --- | --- |
| `id` | Globally unique immutable identifier. |
| `type` | Person, company, government, technology, patent, law, city, disease, commodity, infrastructure, and extensible future types. |
| `canonical_name` | Human-readable normalized name. |
| `aliases` | Alternate names, spellings, symbols, handles, and identifiers. |
| `attributes` | Unlimited JSON attributes with source, confidence, and valid time. |
| `geo_scope` | Point, polygon, country, region, or global scope. |
| `valid_time` | Time period when the entity state was true in the world. |
| `system_time` | Time period when ATLAS knew this version. |
| `provenance` | Raw observations and transformations that produced the entity. |

### Relationship

Every connection is a directed, evidence-backed `Relationship`.

| Field | Purpose |
| --- | --- |
| `id` | Globally unique immutable identifier. |
| `source_entity_id` | Origin entity. |
| `target_entity_id` | Destination entity. |
| `type` | Owns, created, works_for, invests_in, depends_on, uses, supplies, competes_with, causes, regulates, threatens, predicts, and extensible future types. |
| `strength` | Magnitude of relationship from 0 to 1 or a typed quantitative value. |
| `confidence` | Evidence quality from 0 to 1. |
| `probability` | Estimated likelihood that the relationship is true. |
| `impact` | Strategic consequence if the relationship changes. |
| `geo_scope` | Geographic applicability. |
| `valid_time` | Historical evolution of the relationship. |
| `evidence_ids` | Observations, documents, data points, and model outputs supporting the edge. |
| `causal_explanation` | Why the connection exists and how it propagates through the graph. |

## 5. PostgreSQL Schemas

```sql
CREATE TABLE entities (
  id UUID PRIMARY KEY,
  entity_type TEXT NOT NULL,
  canonical_name TEXT NOT NULL,
  aliases TEXT[] NOT NULL DEFAULT '{}',
  attributes JSONB NOT NULL DEFAULT '{}',
  geo_scope JSONB,
  valid_from TIMESTAMPTZ,
  valid_to TIMESTAMPTZ,
  system_from TIMESTAMPTZ NOT NULL DEFAULT now(),
  system_to TIMESTAMPTZ,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE TABLE relationships (
  id UUID PRIMARY KEY,
  source_entity_id UUID NOT NULL REFERENCES entities(id),
  target_entity_id UUID NOT NULL REFERENCES entities(id),
  relationship_type TEXT NOT NULL,
  strength NUMERIC(8,6),
  confidence NUMERIC(8,6) NOT NULL,
  probability NUMERIC(8,6) NOT NULL,
  impact JSONB NOT NULL DEFAULT '{}',
  geo_scope JSONB,
  valid_from TIMESTAMPTZ,
  valid_to TIMESTAMPTZ,
  evidence_ids UUID[] NOT NULL DEFAULT '{}',
  causal_explanation TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE TABLE observations (
  id UUID PRIMARY KEY,
  source_id UUID NOT NULL,
  observed_at TIMESTAMPTZ NOT NULL,
  raw_payload JSONB NOT NULL,
  normalized_payload JSONB,
  content_hash TEXT NOT NULL,
  extraction_version TEXT NOT NULL,
  quality_score NUMERIC(8,6),
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  UNIQUE (source_id, content_hash)
);
```

## 6. Graph Schema

Neo4j labels should remain broad and composable: `Entity`, `Person`, `Organization`, `Company`, `Government`, `Country`, `City`, `Technology`, `Market`, `Industry`, `Patent`, `Law`, `ResearchPaper`, `Product`, `Infrastructure`, `NaturalResource`, `Risk`, `Opportunity`, `Scenario`, and `Pattern`.

Relationship types include `OWNS`, `CREATED`, `WORKS_FOR`, `INVESTS_IN`, `DEPENDS_ON`, `USES`, `SUPPLIES`, `COMPETES_WITH`, `COLLABORATES_WITH`, `CAUSES`, `REDUCES`, `INCREASES`, `BLOCKS`, `ENABLES`, `REGULATES`, `DISCOVERS`, `MANUFACTURES`, `IMPORTS`, `EXPORTS`, `SUPPORTS`, `THREATENS`, `LEARNS`, and `PREDICTS`.

All graph edges carry `strength`, `confidence`, `probability`, `impact`, `valid_from`, `valid_to`, `geo_scope`, `evidence_ids`, and `causal_explanation` properties.

## 7. API Specification

Initial REST surface:

| Method | Path | Purpose |
| --- | --- | --- |
| `GET` | `/health` | Service health and runtime metadata. |
| `POST` | `/api/auth/login` | Issue short-lived JWT for administrative users. |
| `GET` | `/api/atlas/blueprint` | Return the executable ATLAS system blueprint. |
| `POST` | `/api/observations` | Ingest raw observations. |
| `GET` | `/api/entities/:id` | Fetch entity state, attributes, evidence, and relationship summary. |
| `GET` | `/api/entities/:id/graph` | Fetch local graph neighborhood. |
| `GET` | `/api/entities/:id/timeline` | Fetch valid-time and system-time history. |
| `POST` | `/api/analysis/causal-chain` | Explain causal paths between observations and outcomes. |
| `POST` | `/api/analysis/pattern-match` | Compare a current situation to historical patterns. |
| `POST` | `/api/analysis/vulnerability-score` | Calculate Atlas Vulnerability Score. |
| `POST` | `/api/analysis/opportunities` | Discover opportunities from problems, affected populations, and constraints. |
| `POST` | `/api/analysis/scenarios` | Generate optimistic, neutral, pessimistic, and black-swan futures. |

## 8. Intelligence Engines

### World Intelligence Engine

Collects economics, science, company, government, financial, labor, patent, health, climate, energy, education, housing, transportation, and social indicator data. It stores raw observations, normalizes them, deduplicates them, validates quality, creates entities, creates relationships, and emits graph mutation events.

### Economy Engine

Tracks GDP, inflation, rates, employment, wages, trade, housing, construction, real estate, banking, credit, debt, currencies, equities, commodities, energy prices, and leading indicators. It detects cycles, recessions, recoveries, and structural shifts.

### Company Engine

Maintains company history, founders, executives, employees, products, markets, customers, suppliers, competitors, financials, patents, AI adoption, technology stack, culture, ESG, reputation, growth, risks, and opportunities.

### AI Engine

Tracks foundation models, agents, robotics, computer vision, speech, multimodal systems, startups, investment, regulation, jobs, skills, and enterprise adoption.

### Human Engine

Models human needs including food, water, health, housing, education, employment, money, family, security, privacy, purpose, belonging, creativity, transportation, communication, time, and learning. It translates needs into pain points, behavior, consumption, frustration, market demand, and product opportunities.

### Pattern Engine

Maintains a library of recurring patterns including technology adoption, bubbles, recessions, housing crises, supply chain failures, company growth, company collapse, innovation cycles, labor shifts, AI adoption, population aging, and urbanization. Similarity is calculated from graph motifs, time-series signatures, semantic embeddings, causal structure, and geographic context.

### Causal Engine

Generates causal chains instead of isolated statements. For example, a housing answer must connect construction, population, supply, interest rates, migration, demand, affordability, credit availability, and policy constraints before reaching a conclusion.

### Vulnerability Engine

Calculates Atlas Vulnerability Score from fragility, dependency concentration, financial exposure, technological disruption, competition, political exposure, social exposure, climate exposure, evidence freshness, and confidence.

### Opportunity Engine

Every opportunity includes the problem, people affected, economic cost, market size, competition, technology readiness, AI applicability, growth rate, barriers, expected ROI, assumptions, and confidence.

### Future Engine

Produces multiple futures rather than a single forecast: optimistic, neutral, pessimistic, and black-swan scenarios. Each scenario includes probability, assumptions, trigger conditions, leading indicators, affected entities, second-order effects, and decision options.

## 9. Security Architecture

Security uses zero-trust defaults, short-lived JWTs, role-based and attribute-based authorization, service-to-service mTLS, signed plugins, immutable audit logs, secret rotation, row-level tenant isolation, source provenance tracking, prompt-injection filtering for untrusted content, and policy gates for high-impact automated actions.

## 10. Frontend Architecture

The frontend should be a React and TypeScript intelligence workbench with a graph-first interaction model. Users zoom from world to country, industry, company, technology, person, problem, opportunity, and future. The UI combines graph visualization, temporal replay, map layers, evidence panels, scenario trees, causal-chain explainers, and analyst notebooks.

## 11. Deployment Architecture

ATLAS deploys on Kubernetes with Terraform-managed cloud infrastructure, Kafka for streaming, PostgreSQL for operational records, Neo4j-compatible graph storage, Redis caching, DuckDB/lakehouse analytics, Elasticsearch/OpenSearch retrieval, vector search, OpenTelemetry observability, centralized logs, SLO dashboards, and blue/green releases.

## 12. Testing Strategy

Testing layers include domain unit tests, schema contract tests, ingestion replay tests, graph mutation tests, entity-resolution golden sets, causal-chain evaluation, pattern similarity benchmarks, vulnerability score calibration, scenario simulation backtests, API integration tests, authorization tests, load tests, chaos tests, and analyst UX acceptance tests.

## 13. Roadmap

1. Establish identity, health, blueprint, and event contracts.
2. Implement observation ingestion with raw storage and provenance.
3. Build entity-resolution and relationship extraction pipelines.
4. Add PostgreSQL, graph, search, cache, and vector adapters.
5. Deliver graph explorer and evidence-backed entity pages.
6. Release causal, pattern, vulnerability, opportunity, and future engines as independently versioned services.
7. Scale to multi-region deployment, streaming updates, plugin marketplace, and continuous evaluation.

## 14. Future Expansion

Long-term expansion includes autonomous source discovery, multilingual ingestion, geopolitical modeling, supply-chain digital twins, climate-risk propagation, regulatory simulation, enterprise private graphs, collaborative analyst workflows, agentic investigation plans, and continuous model governance over decades.
