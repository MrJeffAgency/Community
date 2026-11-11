"""Data types used by the Community Bot SDK.

They deliberately look and feel like ``python-telegram-bot`` objects so that
existing bot code keeps working: ``update.effective_message.reply_text(...)``,
``update.effective_user.id``, ``update.effective_chat.id`` and so on.
"""

from __future__ import annotations

from dataclasses import dataclass, field
from typing import Any, Optional

MAX_MESSAGE_LENGTH = 4000


def _split_text(text: str, limit: int = MAX_MESSAGE_LENGTH) -> list[str]:
    """Split long messages on a line boundary when possible."""
    text = str(text if text is not None else "")
    if len(text) <= limit:
        return [text]
    chunks: list[str] = []
    remaining = text
    while len(remaining) > limit:
        cut = remaining.rfind("\n", 0, limit)
        if cut < limit // 2:
            cut = limit
        chunks.append(remaining[:cut])
        remaining = remaining[cut:].lstrip("\n")
    if remaining:
        chunks.append(remaining)
    return chunks


@dataclass
class User:
    """A Community profile that talked to the bot."""

    id: str
    username: str = ""
    first_name: str = ""
    last_name: str = ""
    is_bot: bool = False

    @property
    def full_name(self) -> str:
        return " ".join(part for part in (self.first_name, self.last_name) if part).strip() or self.id


@dataclass
class Chat:
    """The conversation a message belongs to."""

    id: str
    type: str = "private"


@dataclass
class Message:
    """A message delivered to the bot."""

    message_id: int
    chat: Chat
    text: str = ""
    from_user: Optional[User] = None
    date: int = 0
    _bot: Any = field(default=None, repr=False, compare=False)

    async def reply_text(self, text: str, **kwargs: Any) -> "Message":
        """Send a text reply to this chat."""
        if self._bot is None:
            raise RuntimeError("This message is not attached to a bot")
        sent = []
        for chunk in _split_text(text):
            sent.append(await self._bot.send_message(self.chat.id, chunk))
        return sent[-1] if sent else self

    async def reply(self, text: str, **kwargs: Any) -> "Message":
        return await self.reply_text(text, **kwargs)

    def to_dict(self) -> dict[str, Any]:
        return {
            "message_id": self.message_id,
            "chat": {"id": self.chat.id, "type": self.chat.type},
            "from": self.from_user.id if self.from_user else "",
            "text": self.text,
            "date": self.date,
        }


@dataclass
class Update:
    """One incoming event, currently always a message."""

    update_id: int
    message: Optional[Message] = None

    #: Passed to ``Application.run_polling(allowed_updates=...)``.
    ALL_TYPES = ("message",)

    @property
    def effective_message(self) -> Optional[Message]:
        return self.message

    @property
    def effective_user(self) -> Optional[User]:
        return self.message.from_user if self.message else None

    @property
    def effective_chat(self) -> Optional[Chat]:
        return self.message.chat if self.message else None

    @classmethod
    def from_api(cls, payload: dict[str, Any], bot: Any = None) -> "Update":
        raw = payload.get("message") or {}
        chat_id = str(raw.get("chat_id") or raw.get("from") or "")
        chat = Chat(id=chat_id, type="private")
        user = User(id=chat_id, username="", first_name="")
        message = Message(
            message_id=int(payload.get("update_id") or raw.get("message_id") or 0),
            chat=chat,
            text=str(raw.get("text") or ""),
            from_user=user,
            date=int(raw.get("date") or 0),
            _bot=bot,
        )
        return cls(update_id=int(payload.get("update_id") or 0), message=message)
