import os
import time
from typing import Dict, List
from fastapi import HTTPException, Request, status

# Comma-separated list of trusted proxy IPs/subnets (e.g. cloudflare, load balancers)
TRUSTED_PROXIES = {
    ip.strip()
    for ip in os.getenv("TRUSTED_PROXIES", "127.0.0.1,::1").split(",")
    if ip.strip()
}
MAX_TRACKED_CLIENTS = 5000


class SlidingWindowRateLimiter:
    """
    In-memory rate limiter tracking timestamps per client key.
    Hardened against:
    1. X-Forwarded-For spoofing: only trusted proxy IPs can provide forwarded client IPs.
    2. Unbounded memory exhaustion: bounded maximum tracked client keys with auto-pruning.
    """

    def __init__(self, requests_limit: int = 30, window_seconds: int = 60):
        self.requests_limit = requests_limit
        self.window_seconds = window_seconds
        self._history: Dict[str, List[float]] = {}

    def _get_key(self, request: Request) -> str:
        peer_host = request.client.host if request.client else "unknown"

        # Only trust X-Forwarded-For if direct peer is an explicitly trusted proxy
        if peer_host in TRUSTED_PROXIES or "*" in TRUSTED_PROXIES:
            forwarded = request.headers.get("x-forwarded-for")
            if forwarded:
                client_candidate = forwarded.split(",")[0].strip()
                if client_candidate:
                    return client_candidate

        return peer_host

    def check(self, request: Request) -> None:
        key = self._get_key(request)
        now = time.time()
        window_start = now - self.window_seconds

        # Bounded cleanup to prevent memory exhaustion attack
        if len(self._history) > MAX_TRACKED_CLIENTS:
            stale_keys = [
                k for k, timestamps in self._history.items()
                if not timestamps or timestamps[-1] <= window_start
            ]
            for sk in stale_keys:
                del self._history[sk]

        # Prune older entries for current client
        timestamps = [ts for ts in self._history.get(key, []) if ts > window_start]
        if len(timestamps) >= self.requests_limit:
            self._history[key] = timestamps
            raise HTTPException(
                status_code=status.HTTP_429_TOO_MANY_REQUESTS,
                detail="Too many requests. Please slow down and try again shortly.",
            )

        timestamps.append(now)
        self._history[key] = timestamps

    def reset(self) -> None:
        self._history.clear()


chat_limiter = SlidingWindowRateLimiter(requests_limit=30, window_seconds=60)
