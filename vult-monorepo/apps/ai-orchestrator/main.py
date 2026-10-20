import asyncio
import hmac
import logging
import os
from contextlib import asynccontextmanager
from typing import Literal
from uuid import uuid4

from fastapi import FastAPI, Header, HTTPException, status
from openai import AsyncOpenAI
from pydantic import BaseModel, Field
from qdrant_client import QdrantClient, models

logging.basicConfig(level=os.getenv("LOG_LEVEL", "INFO"))
logger = logging.getLogger("vult.ai")

QDRANT_URL = os.getenv("QDRANT_URL", "http://localhost:6333")
COLLECTION_NAME = os.getenv("QDRANT_COLLECTION", "vult_enterprise_memory")
EMBEDDING_MODEL = os.getenv("EMBEDDING_MODEL", "text-embedding-3-small")
EMBEDDING_DIMENSIONS = int(os.getenv("EMBEDDING_DIMENSIONS", "1536"))
AI_SERVICE_TOKEN = os.getenv("AI_SERVICE_TOKEN", "")
qdrant = QdrantClient(url=QDRANT_URL, timeout=10)
openai = AsyncOpenAI(api_key=os.getenv("OPENAI_API_KEY")) if os.getenv("OPENAI_API_KEY") else None


@asynccontextmanager
async def lifespan(_: FastAPI):
    if not AI_SERVICE_TOKEN:
        raise RuntimeError("AI_SERVICE_TOKEN must be set before starting the AI service")
    if openai is None:
        raise RuntimeError("OPENAI_API_KEY must be set before starting the AI service")
    collections = await asyncio.to_thread(qdrant.get_collections)
    if COLLECTION_NAME not in {collection.name for collection in collections.collections}:
        await asyncio.to_thread(
            qdrant.create_collection,
            collection_name=COLLECTION_NAME,
            vectors_config=models.VectorParams(size=EMBEDDING_DIMENSIONS, distance=models.Distance.COSINE),
        )
        logger.info("Created Qdrant collection %s", COLLECTION_NAME)
    yield
    await asyncio.to_thread(qdrant.close)


app = FastAPI(
    title="Vult AI Orchestrator",
    description="Tenant-scoped retrieval service for enterprise memory",
    version="2.0.0",
    lifespan=lifespan,
    docs_url="/docs" if os.getenv("ENVIRONMENT", "development") != "production" else None,
    redoc_url=None,
)


class MemoryIngestRequest(BaseModel):
    content: str = Field(min_length=1, max_length=20_000)
    source_type: Literal["PEC", "INVOICE", "EMAIL", "MEETING", "NOTE"]
    source_id: str | None = Field(default=None, max_length=200)


class SearchQueryRequest(BaseModel):
    query: str = Field(min_length=1, max_length=4_000)
    limit: int = Field(default=5, ge=1, le=20)


def authorize_service(authorization: str | None, tenant_id: str | None) -> str:
    expected = f"Bearer {AI_SERVICE_TOKEN}"
    if not authorization or not hmac.compare_digest(authorization, expected):
        raise HTTPException(status_code=status.HTTP_401_UNAUTHORIZED, detail="Invalid service credentials")
    if not tenant_id or len(tenant_id) > 80:
        raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail="Tenant context required")
    return tenant_id


async def embed(text: str) -> list[float]:
    if openai is None:
        raise HTTPException(status_code=503, detail="Embedding provider is not configured")
    response = await openai.embeddings.create(
        model=EMBEDDING_MODEL,
        input=text,
        dimensions=EMBEDDING_DIMENSIONS,
    )
    return response.data[0].embedding


@app.get("/health")
async def health():
    return {"status": "healthy"}


@app.post("/api/v1/ai/ingest")
async def ingest_memory(
    req: MemoryIngestRequest,
    authorization: str | None = Header(default=None),
    x_tenant_id: str | None = Header(default=None),
):
    tenant_id = authorize_service(authorization, x_tenant_id)
    vector_id = str(uuid4())
    try:
        vector = await embed(req.content)
        point = models.PointStruct(
            id=vector_id,
            vector=vector,
            payload={
                "tenant_id": tenant_id,
                "content": req.content,
                "source_type": req.source_type,
                "source_id": req.source_id,
            },
        )
        await asyncio.to_thread(qdrant.upsert, COLLECTION_NAME, points=[point], wait=True)
        return {"success": True, "vector_id": vector_id}
    except HTTPException:
        raise
    except Exception:
        logger.exception("AI memory ingestion failed for tenant %s", tenant_id)
        raise HTTPException(status_code=502, detail="Memory ingestion failed") from None


@app.post("/api/v1/ai/search")
async def search_memory(
    req: SearchQueryRequest,
    authorization: str | None = Header(default=None),
    x_tenant_id: str | None = Header(default=None),
):
    tenant_id = authorize_service(authorization, x_tenant_id)
    tenant_filter = models.Filter(
        must=[models.FieldCondition(key="tenant_id", match=models.MatchValue(value=tenant_id))]
    )
    try:
        query_vector = await embed(req.query)
        response = await asyncio.to_thread(
            qdrant.query_points,
            collection_name=COLLECTION_NAME,
            query=query_vector,
            query_filter=tenant_filter,
            limit=req.limit,
            with_payload=True,
        )
        data = [
            {
                "score": point.score,
                "content": (point.payload or {}).get("content"),
                "source_type": (point.payload or {}).get("source_type"),
                "source_id": (point.payload or {}).get("source_id"),
            }
            for point in response.points
        ]
        return {"success": True, "data": data}
    except HTTPException:
        raise
    except Exception:
        logger.exception("AI memory search failed for tenant %s", tenant_id)
        raise HTTPException(status_code=502, detail="Memory search failed") from None