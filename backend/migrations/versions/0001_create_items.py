"""create items

Revision ID: 0001
Revises:
Create Date: 2026-11-23
"""
from alembic import op
import sqlalchemy as sa
from sqlalchemy.dialects import postgresql

revision = "0001"
down_revision = None
branch_labels = None
depends_on = None


def upgrade() -> None:
    op.create_table(
        "items",
        sa.Column("id", postgresql.UUID(as_uuid=True), primary_key=True,
                  server_default=sa.text("gen_random_uuid()")),
        sa.Column("user_id", postgresql.UUID(as_uuid=True), nullable=False,
                  server_default=sa.text("auth.uid()")),
        sa.Column("type", sa.Text, nullable=False),
        sa.Column("title", sa.Text, nullable=False),
        sa.Column("url", sa.Text),
        sa.Column("memo", sa.Text, nullable=False),
        sa.Column("status", sa.Text),
        sa.Column("tags", postgresql.ARRAY(sa.Text), nullable=False,
                  server_default=sa.text("'{}'")),
        sa.Column("created_at", sa.TIMESTAMP(timezone=True), nullable=False,
                  server_default=sa.text("now()")),
        sa.Column("updated_at", sa.TIMESTAMP(timezone=True), nullable=False,
                  server_default=sa.text("now()")),
        sa.ForeignKeyConstraint(["user_id"], ["auth.users.id"], ondelete="CASCADE"),
        sa.CheckConstraint("type in ('book', 'site')", name="items_type_check"),
        sa.CheckConstraint("char_length(title) between 1 and 200", name="items_title_check"),
        sa.CheckConstraint(
            "url is null or (url ~ '^https?://' and char_length(url) <= 2048)",
            name="items_url_check"),
        sa.CheckConstraint("char_length(memo) between 1 and 10000", name="items_memo_check"),
        sa.CheckConstraint(
            "status is null or status in ('want_to_read', 'reading', 'done')",
            name="items_status_check"),
        sa.CheckConstraint("cardinality(tags) <= 10", name="items_tags_check"),
        sa.CheckConstraint("type <> 'site' or url is not null", name="site_requires_url"),
        schema="public",
    )
    op.create_index(
        "items_user_type_created_idx", "items",
        ["user_id", "type", sa.text("created_at desc")], schema="public")

    op.execute("""
        create function public.set_updated_at() returns trigger
        language plpgsql set search_path = '' as $$
        begin
          new.updated_at = now();
          return new;
        end;
        $$
    """)
    op.execute("""
        create trigger items_set_updated_at
          before update on public.items
          for each row execute function public.set_updated_at()
    """)

    op.execute("alter table public.items enable row level security")
    op.execute("""
        create policy items_select_own on public.items
          for select to authenticated using (user_id = (select auth.uid()))
    """)
    op.execute("""
        create policy items_insert_own on public.items
          for insert to authenticated with check (user_id = (select auth.uid()))
    """)
    op.execute("""
        create policy items_update_own on public.items
          for update to authenticated
          using (user_id = (select auth.uid())) with check (user_id = (select auth.uid()))
    """)
    op.execute("""
        create policy items_delete_own on public.items
          for delete to authenticated using (user_id = (select auth.uid()))
    """)

    op.execute("revoke all on public.items from anon")
    op.execute("grant select, insert, update, delete on public.items to authenticated")

    # パスワードは別途手作業で設定する（マイグレーションには書かない）
    op.execute("""
        do $$
        begin
          if not exists (select 1 from pg_roles where rolname = 'reading_app_api') then
            create role reading_app_api login noinherit nobypassrls;
          end if;
        end
        $$
    """)
    op.execute("grant authenticated to reading_app_api")


def downgrade() -> None:
    op.execute("revoke authenticated from reading_app_api")
    # ロール自体は他の DB 権限を持つ可能性があるため削除しない
    op.execute("drop policy items_delete_own on public.items")
    op.execute("drop policy items_update_own on public.items")
    op.execute("drop policy items_insert_own on public.items")
    op.execute("drop policy items_select_own on public.items")
    op.execute("drop trigger items_set_updated_at on public.items")
    op.execute("drop function public.set_updated_at()")
    op.drop_index("items_user_type_created_idx", table_name="items", schema="public")
    op.drop_table("items", schema="public")
