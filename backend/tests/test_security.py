"""DB 層のセキュリティテスト（RLS・権限・制約）。"""
import json

import pytest
from sqlalchemy import text
from sqlalchemy.exc import DBAPIError, IntegrityError, ProgrammingError

from tests.conftest import USER_A, USER_B


def as_user(conn, user_id):
    """authenticated ロールに切り替え、ユーザーID を設定する。"""
    conn.execute(text("set local role authenticated"))
    conn.execute(
        text("select set_config('request.jwt.claims', :c, true)"),
        {"c": json.dumps({"sub": str(user_id), "role": "authenticated"})},
    )


def insert_item(conn, **over):
    params = {"type": "book", "title": "t", "url": None, "memo": "m", **over}
    return conn.execute(
        text(
            "insert into public.items (type, title, url, memo) "
            "values (:type, :title, :url, :memo) returning id, user_id"
        ),
        params,
    ).one()


def test_ロール切り替えなしではitemsを読めない(api_engine):
    with api_engine.begin() as conn:
        with pytest.raises(ProgrammingError, match="permission denied"):
            conn.execute(text("select * from public.items"))


def test_ロール切り替えなしではitemsに書き込めない(api_engine):
    with api_engine.connect() as conn:
        with pytest.raises(ProgrammingError, match="permission denied"):
            conn.execute(
                text("insert into public.items (user_id, type, title, memo) "
                     "values (:u, 'book', 't', 'm')"),
                {"u": USER_A},
            )


def test_user_idはauth_uidが自動設定される(api_engine):
    with api_engine.begin() as conn:
        as_user(conn, USER_A)
        row = insert_item(conn)
    assert row.user_id == USER_A


def test_他ユーザーのデータは一覧に出ない(api_engine):
    with api_engine.begin() as conn:
        as_user(conn, USER_A)
        insert_item(conn, title="Aの本")
    with api_engine.begin() as conn:
        as_user(conn, USER_B)
        assert conn.execute(text("select * from public.items")).all() == []
    with api_engine.begin() as conn:
        as_user(conn, USER_A)
        assert len(conn.execute(text("select * from public.items")).all()) == 1


def test_他ユーザーのデータは更新も削除もできない(api_engine):
    with api_engine.begin() as conn:
        as_user(conn, USER_A)
        item_id = insert_item(conn).id
    with api_engine.begin() as conn:
        as_user(conn, USER_B)
        upd = conn.execute(
            text("update public.items set title = 'hack' where id = :i"), {"i": item_id}
        )
        dele = conn.execute(text("delete from public.items where id = :i"), {"i": item_id})
        assert upd.rowcount == 0
        assert dele.rowcount == 0


def test_他ユーザーのuser_idでは登録できない(api_engine):
    with api_engine.begin() as conn:
        as_user(conn, USER_A)
        with pytest.raises(DBAPIError, match="row-level security"):
            conn.execute(
                text("insert into public.items (user_id, type, title, memo) "
                     "values (:u, 'book', 't', 'm')"),
                {"u": USER_B},
            )


def test_user_idを他ユーザーに書き換えられない(api_engine):
    with api_engine.begin() as conn:
        as_user(conn, USER_A)
        item_id = insert_item(conn).id
    with api_engine.begin() as conn:
        as_user(conn, USER_A)
        with pytest.raises(DBAPIError, match="row-level security"):
            conn.execute(
                text("update public.items set user_id = :u where id = :i"),
                {"u": USER_B, "i": item_id},
            )


def test_ユーザー未設定ではデータが見えない(api_engine):
    with api_engine.begin() as conn:
        as_user(conn, USER_A)
        insert_item(conn)
    with api_engine.begin() as conn:
        conn.execute(text("set local role authenticated"))
        assert conn.execute(text("select * from public.items")).all() == []


def test_接続ロールにBYPASSRLSやスーパーユーザー権限がない(admin_engine):
    with admin_engine.connect() as conn:
        row = conn.execute(
            text("select rolbypassrls, rolsuper, rolinherit from pg_roles "
                 "where rolname = 'reading_app_api'")
        ).one()
    assert (row.rolbypassrls, row.rolsuper, row.rolinherit) == (False, False, False)


def test_anonロールはitemsにアクセスできない(admin_engine):
    with admin_engine.begin() as conn:
        conn.execute(text("set local role anon"))
        with pytest.raises(ProgrammingError, match="permission denied"):
            conn.execute(text("select * from public.items"))


def test_サイトはURLなしで登録できない(api_engine):
    with api_engine.begin() as conn:
        as_user(conn, USER_A)
        with pytest.raises(IntegrityError, match="site_requires_url"):
            insert_item(conn, type="site", url=None)


def test_本はURLなしで登録できる(api_engine):
    with api_engine.begin() as conn:
        as_user(conn, USER_A)
        insert_item(conn, type="book", url=None)


@pytest.mark.parametrize(
    "over",
    [
        {"type": "movie"},
        {"title": ""},
        {"title": "a" * 201},
        {"memo": ""},
        {"memo": "a" * 10001},
        {"url": "javascript:alert(1)"},
        {"url": "https://example.com/" + "a" * 2048},
    ],
)
def test_不正な値はCHECK制約で拒否される(api_engine, over):
    with api_engine.begin() as conn:
        as_user(conn, USER_A)
        with pytest.raises(IntegrityError):
            insert_item(conn, **over)


def test_statusは決まった値のみ(api_engine):
    with api_engine.begin() as conn:
        as_user(conn, USER_A)
        with pytest.raises(IntegrityError):
            conn.execute(
                text("insert into public.items (type, title, memo, status) "
                     "values ('book', 't', 'm', 'bogus')")
            )


def test_タグは10個まで(api_engine):
    with api_engine.begin() as conn:
        as_user(conn, USER_A)
        with pytest.raises(IntegrityError):
            conn.execute(
                text("insert into public.items (type, title, memo, tags) "
                     "values ('book', 't', 'm', :t)"),
                {"t": [f"t{i}" for i in range(11)]},
            )


def test_更新するとupdated_atが進む(api_engine):
    with api_engine.begin() as conn:
        as_user(conn, USER_A)
        item_id = insert_item(conn).id
    with api_engine.begin() as conn:
        as_user(conn, USER_A)
        before = conn.execute(
            text("select created_at, updated_at from public.items where id = :i"),
            {"i": item_id},
        ).one()
        conn.execute(text("select pg_sleep(0.01)"))
        conn.execute(text("update public.items set title = 'new' where id = :i"), {"i": item_id})
    with api_engine.begin() as conn:
        as_user(conn, USER_A)
        after = conn.execute(
            text("select created_at, updated_at from public.items where id = :i"),
            {"i": item_id},
        ).one()
    assert after.created_at == before.created_at
    assert after.updated_at > before.updated_at
