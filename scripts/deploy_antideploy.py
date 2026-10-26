"""
NagarSetu — Antideploy deploy script.
Packages project directory into gzipped tarball excluding local build/cache/secret artifacts,
and uploads to POST https://antideploy.com/api/v1/deploy.
"""

import io
import json
import os
from pathlib import Path
import sys
import tarfile
import time
import urllib.error
import urllib.request

CONFIG_PATH = Path.home() / ".antideploy" / "config.json"
APP_CONFIG = Path(".antideploy.json")

if not CONFIG_PATH.exists():
    print("Error: ~/.antideploy/config.json not found.", file=sys.stderr)
    sys.exit(1)

with open(CONFIG_PATH, "r", encoding="utf-8") as f:
    token = json.load(f)["token"]

if not APP_CONFIG.exists():
    print("Error: .antideploy.json not found.", file=sys.stderr)
    sys.exit(1)

with open(APP_CONFIG, "r", encoding="utf-8") as f:
    app_id = json.load(f)["applicationId"]

print(f"Target Application ID: {app_id}")
print("Packaging workspace into tar.gz...")

excluded_dirs = {
    ".git",
    "node_modules",
    ".next",
    "__pycache__",
    ".pytest_cache",
    ".vscode",
    "graft",
}

buf = io.BytesIO()
with tarfile.open(fileobj=buf, mode="w:gz") as tar:
    for root, dirs, files in os.walk("."):
        # filter directories in place to prevent recursion
        dirs[:] = [d for d in dirs if d not in excluded_dirs]
        # In frontend, only include 'out' directory
        rel_root = Path(root).relative_to(".")
        parts = rel_root.parts
        if len(parts) > 0 and parts[0] == "frontend":
            if len(parts) == 1 or parts[1] != "out":
                continue

        for f in files:
            if f.endswith(".pyc") or f == ".env" or f == "package.json" or f == "package-lock.json":
                continue
            path = Path(root) / f
            arcname = path.relative_to(".")
            tar.add(str(path), arcname=str(arcname).replace("\\", "/"))

archive_bytes = buf.getvalue()
print(f"Archive packaged: {len(archive_bytes)} bytes ({len(archive_bytes) / (1024*1024):.2f} MB).")

boundary = "----AntideployBoundary7MA4YWxkTrZu0gW"
body = bytearray()
body.extend(f"--{boundary}\r\n".encode("utf-8"))
body.extend(b'Content-Disposition: form-data; name="archive"; filename="nagarsetu.tar.gz"\r\n')
body.extend(b"Content-Type: application/gzip\r\n\r\n")
body.extend(archive_bytes)
body.extend(f"\r\n--{boundary}--\r\n".encode("utf-8"))

url = f"https://antideploy.com/api/v1/deploy?applicationId={app_id}"
req = urllib.request.Request(
    url,
    data=bytes(body),
    headers={
        "Authorization": f"Bearer {token}",
        "Content-Type": f"multipart/form-data; boundary={boundary}",
        "Content-Length": str(len(body)),
    },
    method="POST",
)

print(f"Uploading to {url}...")
try:
    with urllib.request.urlopen(req, timeout=120) as resp:
        result = json.loads(resp.read().decode("utf-8"))
        print(f"Deploy queued successfully! HTTP {resp.status}")
        print(json.dumps(result, indent=2))
        task_id = result.get("taskId")
        if task_id:
            with open(".deploy_task.json", "w", encoding="utf-8") as tf:
                json.dump(result, tf, indent=2)
            print(f"Saved deployment task ID: {task_id}")
except urllib.error.HTTPError as e:
    print(f"HTTPError {e.code}: {e.read().decode('utf-8')}", file=sys.stderr)
    sys.exit(1)
