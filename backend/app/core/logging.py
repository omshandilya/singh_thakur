import logging
import re
import sys
from typing import Any
from app.core.config import settings

# Sensitive keys and patterns to redact from logs
SENSITIVE_PATTERNS = [
    r"password",
    r"token",
    r"secret",
    r"authorization",
    r"bearer",
    r"cookie",
    r"card_number",
    r"cvv",
    r"pan",
    r"aadhaar",
    r"bank_account",
    r"account_number",
]

REDACTED_TEXT = "[REDACTED]"


class SensitiveDataFilter(logging.Filter):
    """
    Log filter that masks sensitive data (passwords, tokens, PAN, Aadhaar, etc.)
    from log records to ensure regulatory compliance and client privacy.
    """
    def filter(self, record: logging.LogRecord) -> bool:
        try:
            if isinstance(record.msg, str):
                record.msg = self._redact(record.msg)
            if record.args:
                if isinstance(record.args, dict):
                    record.args = {k: self._redact_value(k, v) for k, v in record.args.items()}
                elif isinstance(record.args, tuple):
                    record.args = tuple(self._redact_arg(arg) for arg in record.args)
        except Exception:
            pass
        return True

    def _redact(self, message: str) -> str:
        for pattern in SENSITIVE_PATTERNS:
            message = re.sub(
                rf'(?i)("{pattern}"\s*:\s*)"[^"]+"',
                rf'\1"{REDACTED_TEXT}"',
                message,
            )
            message = re.sub(
                rf'(?i)({pattern}\s*=\s*)[^\s,&]+',
                rf'\1{REDACTED_TEXT}',
                message,
            )
            message = re.sub(
                rf'(?i)(Bearer\s+)[A-Za-z0-9\-\._~\+\/]+=*',
                rf'\1{REDACTED_TEXT}',
                message,
            )
        return message

    def _redact_arg(self, arg: Any) -> Any:
        if isinstance(arg, str):
            return self._redact(arg)
        return arg

    def _redact_value(self, key: str, value: Any) -> Any:
        for pattern in SENSITIVE_PATTERNS:
            if re.search(pattern, str(key), re.IGNORECASE):
                return REDACTED_TEXT
        if isinstance(value, str):
            return self._redact(value)
        return value


def setup_logging() -> logging.Logger:
    """
    Initializes structured application logging with appropriate log levels and filters.
    """
    log_level = logging.INFO if settings.is_production else logging.DEBUG

    formatter = logging.Formatter(
        fmt="%(asctime)s | %(levelname)-8s | [%(name)s:%(lineno)d] - %(message)s",
        datefmt="%Y-%m-%d %H:%M:%S",
    )

    handler = logging.StreamHandler(sys.stdout)
    handler.setLevel(log_level)
    handler.setFormatter(formatter)
    handler.addFilter(SensitiveDataFilter())

    root_logger = logging.getLogger()
    root_logger.setLevel(log_level)
    root_logger.handlers = [handler]

    # Silence overly verbose external loggers
    logging.getLogger("uvicorn.access").setLevel(logging.WARNING)
    logging.getLogger("sqlalchemy.engine").setLevel(logging.WARNING if settings.is_production else logging.INFO)

    app_logger = logging.getLogger("cafirm")
    return app_logger


logger = setup_logging()
