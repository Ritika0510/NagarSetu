# NagarSetu T5.5 golden-path soak - 20 runs, all must pass.
 $api = "http://localhost:8000"
 $queries = @(
  @{ msg = "I want to open a small shop in Chandigarh"; proc = "chandigarh_trade_license" },
  @{ msg = "I need a new water connection for my house"; proc = "water_connection" },
  @{ msg = "How do I pay my property tax in Chandigarh?"; proc = "property_tax" }
)
 $pass = 0
 $fail = 0

for ($i = 1; $i -le 20; $i++) {
  $q = $queries[($i - 1) % 3]
  $sid = "soak-$i"
  $status = "unknown"

  $body = @{ session_id = $sid; message = $q.msg; language = "en" } | ConvertTo-Json
  $r = $null
  $ok = $true

  # 1. chat call
  $r = Invoke-RestMethod -Uri "$api/api/chat" -Method Post -ContentType "application/json; charset=utf-8" -Body $body -ErrorAction SilentlyContinue
  if ($null -eq $r) { $ok = $false; $status = "chat call failed" }

  # 2. valid checklist
  if ($ok -and -not $r.checklist.procedure_id) { $ok = $false; $status = "no checklist" }

  # 3. every step cited
  if ($ok) {
    $uncited = @($r.checklist.steps | Where-Object { $_.source_chunk_ids.Count -lt 1 })
    if ($uncited.Count -gt 0) { $ok = $false; $status = "$($uncited.Count) uncited steps" }
  }

  # 4. tick step 1
  if ($ok) {
    $tick = @{ session_id = $sid; procedure_id = $q.proc; step_number = 1; completed = $true } | ConvertTo-Json
    $t = Invoke-RestMethod -Uri "$api/api/progress" -Method Post -ContentType "application/json" -Body $tick -ErrorAction SilentlyContinue
    if ($null -eq $t) { $ok = $false; $status = "progress tick failed" }
  }

  # 5. verify persistence
  if ($ok) {
    $p = Invoke-RestMethod -Uri "$api/api/progress?session_id=$sid&procedure_id=$($q.proc)" -ErrorAction SilentlyContinue
    if ($null -eq $p -or $p.completed_steps -notcontains 1) { $ok = $false; $status = "progress not persisted" }
  }

  if ($ok) {
    $pass++
    Write-Host "RUN $i PASS  $($q.proc) - $($r.checklist.steps.Count) steps, all cited" -ForegroundColor Green
  }
  else {
    $fail++
    Write-Host "RUN $i FAIL  $($q.msg) - $status" -ForegroundColor Red
  }
}

Write-Host ""
Write-Host "RESULT: $pass/20 passed, $fail failed" -ForegroundColor $(if ($fail -eq 0) { "Green" } else { "Red" })