import os
import tempfile
import logging
from typing import Optional

logger = logging.getLogger("wardpulse_backend.storage")

BASE_DIR = os.path.dirname(os.path.dirname(os.path.dirname(os.path.abspath(__file__))))
DATA_DIR = os.path.join(BASE_DIR, "data")
MODEL_DIR = os.path.join(BASE_DIR, "saved_models")

_CACHED_WRITABLE_DATA_DIR: Optional[str] = None
_CACHED_WRITABLE_MODEL_DIR: Optional[str] = None


def get_writable_data_dir() -> str:
    """Returns a guaranteed writable directory for dataset storage.
    
    In local dev and persistent containers (Render), uses backend/data.
    In serverless environments with read-only root filesystems (Vercel /var/task, AWS Lambda),
    falls back transparently to tempfile.gettempdir() (/tmp).
    """
    global _CACHED_WRITABLE_DATA_DIR
    if _CACHED_WRITABLE_DATA_DIR and os.path.isdir(_CACHED_WRITABLE_DATA_DIR):
        return _CACHED_WRITABLE_DATA_DIR

    # 1. Custom override from environment
    custom = os.getenv("CACHE_DIR") or os.getenv("TMPDIR")
    if custom and os.path.isdir(custom):
        _CACHED_WRITABLE_DATA_DIR = custom
        return custom

    # 2. Try standard backend/data directory
    try:
        os.makedirs(DATA_DIR, exist_ok=True)
        test_file = os.path.join(DATA_DIR, ".write_test")
        with open(test_file, "w") as f:
            f.write("ok")
        os.remove(test_file)
        _CACHED_WRITABLE_DATA_DIR = DATA_DIR
        return DATA_DIR
    except (OSError, PermissionError):
        pass

    # 3. Fallback to OS temp directory (always writable on Linux/Vercel /tmp)
    tmp_dir = os.path.join(tempfile.gettempdir(), "wardpulse_data")
    try:
        os.makedirs(tmp_dir, exist_ok=True)
        _CACHED_WRITABLE_DATA_DIR = tmp_dir
        return tmp_dir
    except Exception as e:
        logger.warning(f"Could not create temp data dir {tmp_dir}: {e}")
        return tempfile.gettempdir()


def get_current_dataset_path() -> str:
    """Returns the absolute file path for the active working dataset."""
    return os.path.join(get_writable_data_dir(), "current_dataset.csv")


def get_writable_model_dir() -> str:
    """Returns a guaranteed writable directory for saving trained machine learning models."""
    global _CACHED_WRITABLE_MODEL_DIR
    if _CACHED_WRITABLE_MODEL_DIR and os.path.isdir(_CACHED_WRITABLE_MODEL_DIR):
        return _CACHED_WRITABLE_MODEL_DIR

    # 1. Try standard backend/saved_models directory
    try:
        os.makedirs(MODEL_DIR, exist_ok=True)
        test_file = os.path.join(MODEL_DIR, ".write_test")
        with open(test_file, "w") as f:
            f.write("ok")
        os.remove(test_file)
        _CACHED_WRITABLE_MODEL_DIR = MODEL_DIR
        return MODEL_DIR
    except (OSError, PermissionError):
        pass

    # 2. Fallback to temp models directory
    tmp_models = os.path.join(tempfile.gettempdir(), "wardpulse_models")
    try:
        os.makedirs(tmp_models, exist_ok=True)
        _CACHED_WRITABLE_MODEL_DIR = tmp_models
        return tmp_models
    except Exception as e:
        logger.warning(f"Could not create temp model dir {tmp_models}: {e}")
        return tempfile.gettempdir()


def get_saved_model_path(filename: str = "ward_pulse_model.joblib") -> str:
    """Returns the writable destination path for model checkpointing."""
    return os.path.join(get_writable_model_dir(), filename)


def resolve_model_path_for_reading(filename: str = "ward_pulse_model.joblib") -> Optional[str]:
    """Finds existing model artifact: prefers recently trained model in writable storage,
    falling back to bundled pre-trained baseline in read-only MODEL_DIR."""
    # Check writable storage first (freshly trained model)
    writable_path = os.path.join(get_writable_model_dir(), filename)
    if os.path.exists(writable_path):
        return writable_path

    # Fallback to bundled model in package
    bundled_path = os.path.join(MODEL_DIR, filename)
    if os.path.exists(bundled_path):
        return bundled_path

    return None
