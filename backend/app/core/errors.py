"""Domain-level errors + shared error envelope."""
from pydantic import BaseModel


class DomainError(Exception):
    """Base domain error — mapped to a structured JSON response by the API layer."""

    status_code: int = 500
    code: str = "internal_error"

    def __init__(self, message: str, *, code: str | None = None) -> None:
        super().__init__(message)
        self.message = message
        if code:
            self.code = code


class NotFoundError(DomainError):
    status_code = 404
    code = "not_found"


class ValidationDomainError(DomainError):
    status_code = 422
    code = "invalid_input"


class ErrorResponse(BaseModel):
    ok: bool = False
    code: str
    message: str
