import json
import os
from pathlib import Path
import urllib.request
import psycopg

CONFIG_PATH = Path.home() / ".antideploy" / "config.json"
with open(CONFIG_PATH, "r", encoding="utf-8") as f:
    token = json.load(f)["token"]

app_id = "499fb9bb-6d2a-459f-905e-19be29464961"
req = urllib.request.Request(
    f"https://antideploy.com/api/v1/database/env?applicationId={app_id}",
    headers={"Authorization": f"Bearer {token}"},
)

with urllib.request.urlopen(req) as resp:
    env_content = resp.read().decode("utf-8")

db_url = None
for line in env_content.splitlines():
    if line.startswith("DATABASE_URL="):
        db_url = line.split("=", 1)[1].strip("'\"")
        break

if not db_url:
    print("DATABASE_URL not found!")
    exit(1)

with psycopg.connect(db_url) as conn:
    with conn.cursor() as cur:
        cur.execute("SELECT table_name FROM information_schema.tables WHERE table_schema='public';")
        tables = [r[0] for r in cur.fetchall()]
        print("PostgreSQL Connected successfully! Existing tables:", tables)

        test_session_id = "test-audit-verify"
        cur.execute("INSERT INTO sessions (session_id, language) VALUES (%s, %s) ON CONFLICT (session_id) DO NOTHING;", (test_session_id, "en"))
        cur.execute("""
            INSERT INTO progress (session_id, procedure_id, step_number, completed)
            VALUES (%s, %s, %s, %s)
            ON CONFLICT (session_id, procedure_id, step_number) DO UPDATE SET completed = EXCLUDED.completed
            RETURNING id, completed;
        """, (test_session_id, "chandigarh_trade_license", 1, True))
        row = cur.fetchone()
        print("Insert/Upsert progress row:", row)

        cur.execute("DELETE FROM sessions WHERE session_id = %s;", (test_session_id,))
        conn.commit()
        print("PostgreSQL integration verified and test row cleaned!")
