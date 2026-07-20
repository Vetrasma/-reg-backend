export const atlasBlueprint = {
  mission:
    "Observe the world, understand it, discover hidden relationships, detect recurring patterns, explain causes, identify vulnerabilities, simulate possible futures and discover opportunities before they become obvious.",
  principles: [
    "Represent every observable object as a versioned entity with unlimited attributes.",
    "Represent every relationship with direction, confidence, probability, time, geography, impact, and evidence.",
    "Preserve raw evidence separately from normalized intelligence products.",
    "Continuously update the world model as new observations arrive.",
    "Explain every conclusion with evidence, assumptions, causal chains, and confidence."
  ],
  boundedContexts: [
    "identity-access",
    "source-ingestion",
    "entity-resolution",
    "knowledge-graph",
    "economy-intelligence",
    "company-intelligence",
    "ai-intelligence",
    "human-needs",
    "pattern-detection",
    "causal-reasoning",
    "vulnerability-scoring",
    "opportunity-discovery",
    "future-simulation",
    "explainability",
    "user-experience"
  ],
  coreEngines: [
    {
      name: "World Intelligence Engine",
      responsibility:
        "Collect, normalize, deduplicate, validate, and convert global observations into entities and relationships."
    },
    {
      name: "Pattern Engine",
      responsibility:
        "Detect recurring structural signatures across history, economies, companies, technology adoption, labor shifts, and crises."
    },
    {
      name: "Causal Engine",
      responsibility:
        "Build causal chains and counterfactual explanations from evidence-backed graph relationships."
    },
    {
      name: "Vulnerability Engine",
      responsibility:
        "Score fragility, dependencies, exposures, competition, disruption, political risk, social risk, and climate risk."
    },
    {
      name: "Opportunity Engine",
      responsibility:
        "Identify emerging opportunities with affected populations, market size, barriers, AI applicability, ROI, and confidence."
    },
    {
      name: "Future Engine",
      responsibility:
        "Generate optimistic, neutral, pessimistic, and black-swan scenarios with probabilities and assumptions."
    }
  ],
  storage: {
    operational: "PostgreSQL",
    graph: "Neo4j-compatible property graph",
    analytical: "DuckDB and lakehouse object storage",
    search: "Elasticsearch/OpenSearch",
    cache: "Redis",
    vector: "Pluggable vector database"
  },
  integration: {
    api: "FastAPI-compatible REST and event APIs behind an API gateway",
    events: "Kafka topics for observations, entity mutations, relationship mutations, scores, patterns, and scenarios",
    plugins: "Signed source, model, scoring, visualization, and export plugins"
  }
};
