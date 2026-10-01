from __future__ import annotations

import ipaddress
import math
import threading
import time
from collections import defaultdict, deque

from fastapi import Request
from fastapi.responses import JSONResponse
from starlette.middleware.base import BaseHTTPMiddleware

from app.core.config import settings

WINDOW_SECONDS = 60

TOOL_COSTS: list[tuple[str, int]] = [
    ("/tools/subnet/", 20),
    ("/tools/export/subnet/", 20),
    ("/tools/bulk-check/", 10),
    ("/tools/", 1),
    ("/blacklist/quick-check/", 1),
]
LOGIN_PATHS = ("/user/login/", "/user/create/", "/user/token/refresh/")


class _SlidingWindow:
    def __init__(self) -> None:
        self._events: dict[str, deque[tuple[float, int]]] = defaultdict(deque)
        self._lock = threading.Lock()

    def hit(self, key: str, cost: int, limit: int) -> int | None:
        now = time.monotonic()
        with self._lock:
            q = self._events[key]
            while q and now - q[0][0] >= WINDOW_SECONDS:
                q.popleft()
            used = sum(c for _, c in q)
            if used + cost > limit:
                retry = WINDOW_SECONDS - (now - q[0][0]) if q else WINDOW_SECONDS
                return max(1, math.ceil(retry))
            q.append((now, cost))
            if len(self._events) > 50_000:
                for k in [k for k, v in self._events.items() if not v]:
                    del self._events[k]
            return None

    def reset(self) -> None:
        with self._lock:
            self._events.clear()


limiter = _SlidingWindow()


def _trusted(ip: str) -> bool:
    try:
        addr = ipaddress.ip_address(ip)
    except ValueError:
        return False
    for cidr in settings.trusted_proxies or []:
        try:
            if addr in ipaddress.ip_network(cidr, strict=False):
                return True
        except ValueError:
            continue
    return False


def client_ip(request: Request) -> str:
    peer = request.client.host if request.client else "unknown"
    if not _trusted(peer):
        return peer
    forwarded = request.headers.get("x-forwarded-for", "")
    for hop in reversed([h.strip() for h in forwarded.split(",") if h.strip()]):
        if not _trusted(hop):
            return hop
    return peer


def _cost_and_limit(path: str) -> tuple[str, int, int] | None:
    if path in LOGIN_PATHS:
        return "auth", 1, settings.login_rate_limit_per_minute
    for prefix, cost in TOOL_COSTS:
        if path.startswith(prefix):
            return "tools", cost, settings.rate_limit_per_minute
    return None


class RateLimitMiddleware(BaseHTTPMiddleware):
    async def dispatch(self, request: Request, call_next):
        rule = _cost_and_limit(request.url.path)
        if rule is None or request.method == "OPTIONS":
            return await call_next(request)

        bucket, cost, limit = rule
        if limit <= 0:
            return await call_next(request)

        retry_after = limiter.hit(f"{bucket}:{client_ip(request)}", min(cost, limit), limit)
        if retry_after is not None:
            return JSONResponse(
                status_code=429,
                content={"detail": "Too many requests. Please slow down."},
                headers={"Retry-After": str(retry_after)},
            )
        return await call_next(request)
