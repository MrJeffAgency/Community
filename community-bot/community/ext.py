"""``community.ext`` — the application layer of the Community Bot SDK.

The names mirror ``telegram.ext`` so familiar bot code works unchanged:

    from community.ext import Application, CommandHandler, ContextTypes
"""

from __future__ import annotations

import asyncio
import logging
import os
from dataclasses import dataclass, field
from typing import Any, Callable, Optional, Sequence

from ._bot import AuthError, Bot, CommunityError
from ._types import Update

logger = logging.getLogger("community")


# ---------------------------------------------------------------------- #
# context
# ---------------------------------------------------------------------- #
@dataclass
class CallbackContext:
    """Passed to every handler as ``context``."""

    application: "Application"
    chat_id: Optional[str] = None
    user_id: Optional[str] = None
    args: list[str] = field(default_factory=list)
    error: Optional[BaseException] = None

    @property
    def bot(self) -> Bot:
        return self.application.bot


class ContextTypes:
    """Annotation helper, matching ``telegram.ext.ContextTypes``."""

    DEFAULT_TYPE = CallbackContext


# ---------------------------------------------------------------------- #
# handlers
# ---------------------------------------------------------------------- #
class Handler:
    """Base class for update handlers."""

    def check_update(self, update: Update) -> bool:  # pragma: no cover - overridden
        raise NotImplementedError

    async def handle_update(self, update: Update, context: CallbackContext) -> Any:
        raise NotImplementedError


class CommandHandler(Handler):
    """Runs a callback when a message starts with ``/command``."""

    def __init__(self, command: str | Sequence[str], callback: Callable[..., Any]):
        if isinstance(command, str):
            command = [command]
        self.commands = [str(name).lstrip("/").lower() for name in command if str(name).strip()]
        self.callback = callback

    def _match(self, update: Update) -> Optional[list[str]]:
        message = update.effective_message
        if message is None or not message.text:
            return None
        text = message.text.strip()
        if not text.startswith("/"):
            return None
        head, _, tail = text[1:].partition(" ")
        name = head.split("@", 1)[0].lower()
        if name not in self.commands:
            return None
        return tail.split() if tail else []

    def check_update(self, update: Update) -> bool:
        return self._match(update) is not None

    async def handle_update(self, update: Update, context: CallbackContext) -> Any:
        context.args = self._match(update) or []
        return await self.callback(update, context)

    def __repr__(self) -> str:  # pragma: no cover - debug only
        return f"<CommandHandler {','.join(self.commands)}>"


class MessageHandler(Handler):
    """Runs a callback for every text message (useful for plain replies)."""

    def __init__(self, callback: Callable[..., Any], filters: Any = None):
        self.callback = callback
        self.filters = filters

    def check_update(self, update: Update) -> bool:
        message = update.effective_message
        if message is None or not message.text:
            return False
        if self.filters in (None, "text", "TEXT"):
            return True
        return bool(self.filters)

    async def handle_update(self, update: Update, context: CallbackContext) -> Any:
        message = update.effective_message
        context.args = (message.text.split() if message else [])
        return await self.callback(update, context)


# ---------------------------------------------------------------------- #
# application
# ---------------------------------------------------------------------- #
class ApplicationBuilder:
    """Fluent builder: ``Application.builder().token(...).build()``."""

    def __init__(self) -> None:
        self._token: str = ""
        self._base_url: Optional[str] = None
        self._timeout: float = 30.0
        self._poll_interval: Optional[float] = None

    def token(self, token: str) -> "ApplicationBuilder":
        self._token = str(token or "").strip()
        return self

    def base_url(self, url: str) -> "ApplicationBuilder":
        self._base_url = str(url or "").strip() or None
        return self

    def timeout(self, seconds: float) -> "ApplicationBuilder":
        self._timeout = float(seconds)
        return self

    def poll_interval(self, seconds: float) -> "ApplicationBuilder":
        self._poll_interval = float(seconds)
        return self

    def build(self) -> "Application":
        bot = Bot(
            self._token,
            base_url=self._base_url or os.getenv("COMMUNITY_API_URL") or None,
            timeout=self._timeout,
        )
        return Application(bot=bot, poll_interval=self._poll_interval)


class Application:
    """Long-polling application for a Community bot."""

    def __init__(self, bot: Bot, poll_interval: Optional[float] = None) -> None:
        self.bot = bot
        self.handlers: list[Handler] = []
        self.error_handlers: list[Callable[..., Any]] = []
        env_interval = os.getenv("COMMUNITY_POLL_INTERVAL")
        self.poll_interval = float(
            poll_interval
            if poll_interval is not None
            else (env_interval if env_interval else 1.5)
        )
        self._offset = 0

    # -------------------------- construction -------------------------- #
    @classmethod
    def builder(cls) -> ApplicationBuilder:
        return ApplicationBuilder()

    def add_handler(self, handler: Handler) -> None:
        self.handlers.append(handler)

    def add_error_handler(self, callback: Callable[..., Any]) -> None:
        self.error_handlers.append(callback)

    # ---------------------------- dispatch ---------------------------- #
    async def process_update(self, update: Update) -> None:
        context = CallbackContext(
            application=self,
            chat_id=update.effective_chat.id if update.effective_chat else None,
            user_id=update.effective_user.id if update.effective_user else None,
        )
        for handler in self.handlers:
            try:
                matched = handler.check_update(update)
            except Exception as exc:  # a broken filter must not stop the bot
                await self._report_error(update, context, exc)
                continue
            if not matched:
                continue
            try:
                await handler.handle_update(update, context)
            except Exception as exc:
                await self._report_error(update, context, exc)

    async def _report_error(
        self, update: Optional[Update], context: CallbackContext, error: BaseException
    ) -> None:
        context.error = error
        if not self.error_handlers:
            logger.exception("Unhandled bot error: %s", error)
            return
        for callback in self.error_handlers:
            try:
                result = callback(update, context)
                if asyncio.iscoroutine(result):
                    await result
            except Exception:  # pragma: no cover - error handlers must not loop
                logger.exception("The error handler itself failed")

    # ---------------------------- polling ----------------------------- #
    async def _poll_once(self) -> int:
        raw_updates = await self.bot.get_updates(offset=self._offset)
        for raw in raw_updates:
            update = Update.from_api(raw, bot=self.bot)
            if update.update_id:
                self._offset = max(self._offset, int(update.update_id) + 1)
            await self.process_update(update)
        return len(raw_updates)

    async def run(self, allowed_updates: Any = None) -> None:
        """Run the long-polling loop until cancelled."""
        try:
            me = await self.bot.get_me()
            handle = me.get("username") or me.get("name") or "unknown"
            logger.info("Connected as @%s (token …%s)", handle, self.bot.token[-4:])
        except CommunityError as exc:
            if isinstance(exc, AuthError):
                raise SystemExit(
                    "Bot token rejected. Open Me → Community bots → BotFather, run /token <username>, "
                    "and put the cmb_ token in COMMUNITY_BOT_TOKEN."
                ) from exc
            logger.warning("Could not read bot profile: %s", exc)

        delay = self.poll_interval
        try:
            while True:
                try:
                    await self._poll_once()
                    delay = self.poll_interval
                except AuthError as exc:
                    raise SystemExit(str(exc)) from exc
                except CommunityError as exc:
                    logger.warning("Polling failed: %s", exc)
                    delay = min(30.0, max(self.poll_interval, delay * 2))
                except asyncio.CancelledError:
                    raise
                await asyncio.sleep(delay)
        finally:
            await self.bot.close()

    def run_polling(self, allowed_updates: Any = None, **_: Any) -> None:
        """Blocking entry point, used exactly like ``telegram.ext``."""
        # Keep httpx's per-request INFO logs quiet; bot logs stay readable.
        logging.getLogger("httpx").setLevel(logging.WARNING)
        logging.getLogger("httpcore").setLevel(logging.WARNING)
        logger.info("Bot starting in long-polling mode")
        try:
            asyncio.run(self.run(allowed_updates=allowed_updates))
        except KeyboardInterrupt:
            logger.info("Bot stopped")


def run_polling(application: Application, allowed_updates: Any = None) -> None:
    """Convenience wrapper for ``run_polling(app)``."""
    application.run_polling(allowed_updates=allowed_updates)
