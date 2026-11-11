"""HTTP client for the Community Bot API."""

from __future__ import annotations

import os
from typing import Any, Optional

try:  # httpx is the only third-party dependency
    import httpx
except ImportError as exc:  # pragma: no cover - helpful message instead of a bare ImportError
    raise ImportError(
        "The Community Bot SDK needs httpx. Install it with: pip install httpx"
    ) from exc

DEFAULT_API_URL = "https://community-bot-api.hdo-box.workers.dev"


class CommunityError(RuntimeError):
    """Raised when the Bot API returns an error."""

    def __init__(self, message: str, status: Optional[int] = None, body: str = ""):
        super().__init__(message)
        self.status = status
        self.body = body


class AuthError(CommunityError):
    """The bot token was rejected. Get a fresh token from BotFather."""


class Bot:
    """A Community bot identified by its ``cmb_...`` token."""

    def __init__(
        self,
        token: str,
        base_url: Optional[str] = None,
        timeout: float = 30.0,
    ) -> None:
        token = str(token or "").strip()
        if not token:
            raise CommunityError("A bot token is required. Get one from BotFather in Community Chat.")
        self.token = token
        self.base_url = (base_url or os.getenv("COMMUNITY_API_URL") or DEFAULT_API_URL).rstrip("/")
        self.timeout = float(timeout)
        self._client: Optional[httpx.AsyncClient] = None

    # ------------------------------------------------------------------ #
    # plumbing
    # ------------------------------------------------------------------ #
    async def _http(self) -> httpx.AsyncClient:
        if self._client is None:
            self._client = httpx.AsyncClient(
                base_url=self.base_url,
                timeout=self.timeout,
                headers={
                    "Authorization": f"Bearer {self.token}",
                    "Accept": "application/json",
                    "User-Agent": "community-bot-sdk/1.0",
                },
            )
        return self._client

    async def _request(self, method: str, path: str, **kwargs: Any) -> dict[str, Any]:
        client = await self._http()
        try:
            response = await client.request(method, path, **kwargs)
        except httpx.TimeoutException as exc:
            raise CommunityError(f"The Community API timed out after {self.timeout:.0f}s.") from exc
        except httpx.RequestError as exc:
            raise CommunityError(
                f"Could not reach the Community API at {self.base_url}: {type(exc).__name__}"
            ) from exc

        if response.status_code in (401, 403):
            detail = response.text.strip()[:200]
            if detail.startswith("error code: 1010"):
                raise CommunityError(
                    "Cloudflare blocked this client (error 1010). Send a normal User-Agent header."
                )
            raise AuthError(
                "The bot token was rejected. Create the bot again in BotFather and copy the cmb_ token.",
                response.status_code,
                detail,
            )
        if response.status_code >= 400:
            detail = response.text.strip().replace("\n", " ")[:300]
            raise CommunityError(
                f"Community API returned HTTP {response.status_code}"
                + (f": {detail}" if detail else "."),
                response.status_code,
                detail,
            )
        try:
            return response.json()
        except ValueError:
            return {"ok": True, "raw": response.text}

    async def close(self) -> None:
        if self._client is not None:
            await self._client.aclose()
            self._client = None

    # ------------------------------------------------------------------ #
    # Bot API
    # ------------------------------------------------------------------ #
    async def get_me(self) -> dict[str, Any]:
        data = await self._request("GET", "/v1/bots/me")
        return data.get("bot") or {}

    async def get_updates(self, offset: int = 0, limit: int = 50) -> list[dict[str, Any]]:
        data = await self._request(
            "GET",
            "/v1/bots/me/getUpdates",
            params={"offset": max(0, int(offset)), "limit": max(1, min(100, int(limit)))},
        )
        return list(data.get("updates") or [])

    async def send_message(self, chat_id: str, text: str) -> dict[str, Any]:
        data = await self._request(
            "POST",
            "/v1/bots/me/sendMessage",
            json={"chat_id": str(chat_id), "text": str(text)},
        )
        return data.get("message") or {}

    async def set_commands(self, commands: list[dict[str, str]]) -> list[dict[str, str]]:
        data = await self._request("POST", "/v1/bots/me/commands", json={"commands": commands})
        return list(data.get("commands") or [])

    async def search(self, query: str) -> dict[str, Any]:
        return await self._request("GET", "/v1/bots/me/search", params={"q": str(query)})

    async def storage(self, query: str = "") -> dict[str, Any]:
        params = {"q": str(query)} if query else None
        return await self._request("GET", "/v1/bots/me/storage", params=params)

    async def save(
        self,
        content: str,
        chat_id: str = "",
        user_id: str = "",
    ) -> dict[str, Any]:
        return await self._request(
            "POST",
            "/v1/bots/me/save",
            json={"content": str(content), "chat_id": str(chat_id), "user_id": str(user_id)},
        )
