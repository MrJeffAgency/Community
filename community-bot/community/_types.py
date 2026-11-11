from __future__ import annotations
from dataclasses import dataclass, field
from typing import Any, Optional
MAX_MESSAGE_LENGTH = 4000
def _split_text(text, limit=MAX_MESSAGE_LENGTH):
    text = str(text if text is not None else "")
    if len(text) <= limit:
        return [text]
    chunks = []
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
    id: str
    username: str = ""
    first_name: str = ""
    last_name: str = ""
    is_bot: bool = False
    @property
    def full_name(self):
        return " ".join(part for part in (self.first_name, self.last_name) if part).strip() or self.id
@dataclass
class Chat:
    id: str
    type: str = "private"
@dataclass
class Message:
    message_id: int
    chat: Chat
    text: str = ""
    from_user: Optional[User] = None
    date: int = 0
    _bot: Any = field(default=None, repr=False, compare=False)
    async def reply_text(self, text, **kwargs):
        if self._bot is None:
            raise RuntimeError("This message is not attached to a bot")
        sent = []
        for chunk in _split_text(text):
            sent.append(await self._bot.send_message(self.chat.id, chunk))
        return sent[-1] if sent else self
    async def reply(self, text, **kwargs):
        return await self.reply_text(text, **kwargs)
    def to_dict(self):
        return {"message_id": self.message_id, "chat": {"id": self.chat.id, "type": self.chat.type}, "from": self.from_user.id if self.from_user else "", "text": self.text, "date": self.date}
@dataclass
class Update:
    update_id: int
    message: Optional[Message] = None
    ALL_TYPES = ("message",)
    @property
    def effective_message(self):
        return self.message
    @property
    def effective_user(self):
        return self.message.from_user if self.message else None
    @property
    def effective_chat(self):
        return self.message.chat if self.message else None
    @classmethod
    def from_api(cls, payload, bot=None):
        raw = payload.get("message") or {}
        chat_id = str(raw.get("chat_id") or raw.get("from") or "")
        chat = Chat(id=chat_id, type="private")
        user = User(id=chat_id, username="", first_name="")
        message = Message(message_id=int(payload.get("update_id") or raw.get("message_id") or 0), chat=chat, text=str(raw.get("text") or ""), from_user=user, date=int(raw.get("date") or 0), _bot=bot)
        return cls(update_id=int(payload.get("update_id") or 0), message=message)
