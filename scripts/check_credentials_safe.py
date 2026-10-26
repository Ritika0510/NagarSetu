"""Check presence of required environment variables without printing their values."""
from pathlib import Path
import os

env_file = Path(".env")
user_env = Path.home() / ".env"

keys = ["GROQ_API_KEY", "GEMINI_API_KEY", "DATABASE_URL"]

def check_file(path: Path):
    if not path.exists():
        return {}
    res = {}
    with open(path, "r", encoding="utf-8", errors="ignore") as f:
        for line in f:
            line = line.strip()
            if not line or line.startswith("#"):
                continue
            if "=" in line:
                k, v = line.split("=", 1)
                k = k.strip()
                v = v.strip().strip("'\"")
                if k in keys:
                    res[k] = bool(v and not v.startswith("your_") and not v.startswith("sk-placeholder"))
    return res

local_status = check_file(env_file)
home_status = check_file(user_env)

print("--- CREDENTIAL STATUS (SAFE AUDIT) ---")
for k in keys:
    is_set = local_status.get(k, False) or home_status.get(k, False)
    status_str = "[OK] Configured" if is_set else "[MISSING] Not Set"
    print(f"{k}: {status_str}")
