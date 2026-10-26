"""Poll Antideploy task status."""
import sys
import json
import os
import urllib.request
from pathlib import Path

task_id = sys.argv[1] if len(sys.argv) > 1 else "e72c0603-4e9d-4009-ae04-dda9d400cff5"
config_path = Path.home() / ".antideploy" / "config.json"
if not config_path.exists():
    print("No config found")
    sys.exit(1)

with open(config_path, "r", encoding="utf-8") as f:
    token = json.load(f)["token"]

url = f"https://antideploy.com/api/v1/deployments/{task_id}"
req = urllib.request.Request(url, headers={"Authorization": f"Bearer {token}"})
with urllib.request.urlopen(req) as resp:
    data = json.load(resp)
    print(f"Task: {task_id}")
    print(f"Status: {data.get('status')}")
    dep = data.get("deployment") or {}
    if dep:
        print(f"Deployment ID: {dep.get('id')}, Status: {dep.get('status')}")
        if dep.get("error"):
            print(f"Deployment Error: {dep.get('error')}")
    steps = data.get("steps", [])
    for s in steps:
        print(f"  [{s.get('key')}]: {s.get('status')} ({s.get('detail')})")
