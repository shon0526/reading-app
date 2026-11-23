import os
import uuid
from pathlib import Path

import pytest
from alembic import command
from alembic.config import Config
from dotenv import load_dotenv
from sqlalchemy import create_engine, text
from sqlalchemy.engine import make_url

load_dotenv()

BACKEND_DIR = Path(__file__).resolve().parent.parent
API_ROLE_PASSWORD = "test-only-password"

USER_A = uuid.UUID("00000000-0000-0000-0000-00000000000a")
USER_B = uuid.UUID("00000000-0000-0000-0000-00000000000b")


@pytest.fixture(scope="session")
def admin_engine():
    """postgres ロール（マイグレーション・テストデータ準備用）。"""
    url = os.environ["TEST_DATABASE_URL"]
    # マイグレーションは MIGRATION_DATABASE_URL を見るため、テスト用 DB に向ける
    os.environ["MIGRATION_DATABASE_URL"] = url
    cfg = Config(str(BACKEND_DIR / "alembic.ini"))
    command.upgrade(cfg, "head")

    engine = create_engine(url)
    with engine.begin() as conn:
        conn.execute(text(f"alter role reading_app_api password '{API_ROLE_PASSWORD}'"))
        for uid, email in ((USER_A, "a@example.com"), (USER_B, "b@example.com")):
            conn.execute(
                text(
                    "insert into auth.users (id, aud, role, email) "
                    "values (:id, 'authenticated', 'authenticated', :email) "
                    "on conflict (id) do nothing"
                ),
                {"id": uid, "email": email},
            )
    yield engine
    engine.dispose()


@pytest.fixture(scope="session")
def api_engine(admin_engine):
    """reading_app_api ロール（アプリ本番と同じ接続）。"""
    url = make_url(os.environ["TEST_DATABASE_URL"]).set(
        username="reading_app_api", password=API_ROLE_PASSWORD
    )
    engine = create_engine(url)
    yield engine
    engine.dispose()


@pytest.fixture(autouse=True)
def clean_items(admin_engine):
    yield
    with admin_engine.begin() as conn:
        conn.execute(text("truncate public.items"))
