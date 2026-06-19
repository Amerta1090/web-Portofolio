---
title: "Building Production ML Systems: From Sensor to Deployment"
description: "A deep dive into the architecture and decisions behind deploying machine learning models in production environments, covering the full pipeline from data collection to monitoring."
date: 2026-05-15
tags: ["MLOps", "Machine Learning", "DevOps", "Python"]
image: "/og-image.png"
imageAlt: "ML Pipeline Architecture Diagram"
series: "Production ML"
seriesOrder: 1
---

## Introduction

Deploying machine learning models to production is fundamentally different from building them in notebooks. In this post, I'll walk through the architecture and decisions that go into production ML systems, drawing from my experience building end-to-end pipelines.

## The ML Pipeline Architecture

A production ML system consists of several interconnected components that must work together reliably:

### Data Ingestion Layer

The data pipeline starts at the source. For IoT systems, this means sensor data streaming through MQTT or HTTP endpoints. For web applications, it's typically event streams or database extracts.

```python
import asyncio
from typing import AsyncGenerator

async def stream_sensor_data(endpoint: str) -> AsyncGenerator[dict, None]:
    async with aiohttp.ClientSession() as session:
        async with session.ws_connect(endpoint) as ws:
            async for msg in ws:
                yield process_sensor_reading(msg.json())
```

**Key considerations:**
- Data validation at ingestion time
- Schema enforcement with tools like Great Expectations
- Backpressure handling for spike loads
- Exactly-once processing semantics

### Feature Store

A feature store decouples feature engineering from model training and serving. This is one of the most impactful architectural decisions for ML systems.

```python
from feast import FeatureStore
import pandas as pd

store = FeatureStore(repo_path="./feature_repo")

# Training-time feature retrieval
training_features = store.get_historical_features(
    entity_df=entity_df,
    features=[
        "sensor_stats:avg_temperature",
        "sensor_stats:max_humidity",
        "device_metadata:firmware_version",
    ],
).to_df()
```

### Model Training Pipeline

Training pipelines should be reproducible, versioned, and automated. Using tools like MLflow or DVC ensures that every model can be traced back to its training data and parameters.

### Model Serving

The serving architecture depends on latency requirements:

| Strategy | Latency | Use Case |
|----------|---------|----------|
| REST API | 50-200ms | Real-time predictions |
| Batch | Minutes-hours | Daily reporting |
| Edge | <10ms | IoT devices |
| Streaming | <100ms | Real-time events |

### Monitoring & Observability

Once a model is deployed, monitoring becomes critical. You need to track:

1. **Data drift** — input distribution changes over time
2. **Concept drift** — relationship between features and target changes
3. **Performance metrics** — accuracy, latency, throughput
4. **System health** — memory, CPU, error rates

## Lessons Learned

Building production ML systems has taught me several important lessons:

**Start simple.** A simple linear model with good monitoring beats a complex neural network that you can't debug.

**Invest in infrastructure.** The first 20% of ML work gets you 80% of the accuracy. The remaining 80% of the work is infrastructure, monitoring, and reliability.

**Test everything.** ML systems have more failure modes than traditional software. Test data quality, model behavior, and system performance independently.

## Conclusion

Production ML is as much about systems engineering as it is about data science. The key is building robust pipelines that can handle real-world data, monitoring for when things go wrong, and iterating quickly.

<div class="bg-bg-secondary border border-border rounded-xl p-6 my-8">
  <p class="text-text-secondary text-sm">
    <strong>Series:</strong> This is part 1 of the "Production ML" series.
    <a href="/blog/tag/Production%20ML" class="text-accent hover:underline">View all posts in this series →</a>
  </p>
</div>
