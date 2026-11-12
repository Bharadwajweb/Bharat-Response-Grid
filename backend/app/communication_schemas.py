from pydantic import BaseModel, Field, field_validator


class ChatMessageCreate(BaseModel):
    content: str = Field(min_length=1, max_length=4000)

    @field_validator("content")
    @classmethod
    def trim_content(cls, value: str) -> str:
        value = value.strip()
        if not value:
            raise ValueError("Message cannot be blank")
        return value


class MissionStatusUpdate(BaseModel):
    status: str = Field(pattern="^(assigned|active|paused|completed|cancelled)$")
