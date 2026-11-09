#Requires -Version 7
<#
.SYNOPSIS
  Pool of recyclable worktrees for `orchestrate` batches: N fixed folders per project that
  are never deleted. Each unit takes a free one, creates its branch there and frees it when
  done. `node_modules` stays in the slot: `bun install` becomes incremental and there is no
  waiting for Windows to delete thousands of files for every unit.

.DESCRIPTION
  Run from the project's main folder (from a slot works too: the main folder is deduced
  from `git worktree list`).

    wt init    [-Count 4]                creates ..\<repo>-wt\wt1..wtN, installs and copies the .env*
    wt take    <type/branch> [-Slot wtN] takes a free slot and creates (or resumes) the branch there
    wt free    <wtN>                     frees it (detached) and deletes the branch if already merged
    wt status                            table: slot, branch or "free", dirty, port
    wt destroy <wtN> [-Force]            really deletes the slot (only if free)

  Free slot = detached HEAD and empty `git status --porcelain`.

  Fixed port per slot: 4300 + N (wt1 → 4301, wt2 → 4302…). That slot's dev server always
  goes on its port: `bun run dev -- --port <port>`. `take` and `free` stop whatever is still
  listening on that port (orphaned servers from the previous unit).

  `.qa/` (each slot's measuring scripts and logs) is ignored by git in every slot: `init`
  and `take` add it to `.git/info/exclude`. When `take` puts a different branch in the slot,
  it removes the previous unit's `.qa/pr-body.md`, `progress.md`, `*.log` and `.next/dev`,
  `.next/types`; the scripts in `.qa/` stay.

  The `.env*` files (except `.env.example`) are copied from the main folder only if git
  ignores them in the slot: they are never committed.

  Nothing destructive: no `reset --hard`, no `push --force`, no deleting unmerged branches
  (`git branch -d`, never `-D`). `free` requires a clean tree; `destroy` requires a free slot
  and confirmation. `take`s run one after another, not in parallel (they would pick the
  same slot).

.PARAMETER Base
  Starting point of new branches and free slots. Default `origin/main`; in a repo without a
  remote, a local branch (`-Base main`).

.EXAMPLE
  pwsh -NoProfile -File "$env:USERPROFILE\.claude\skills\orchestrate\scripts\wt.ps1" init -Count 4

.EXAMPLE
  pwsh -NoProfile -File "$env:USERPROFILE\.claude\skills\orchestrate\scripts\wt.ps1" take feat/ranking-top20
  # prints slot=wt2, branch=…, path=…, port=4302
#>
[CmdletBinding()]
param(
  [Parameter(Mandatory, Position = 0)]
  [ValidateSet('init', 'take', 'free', 'status', 'destroy')]
  [string] $Command,
  [Parameter(Position = 1)] [string] $Name,
  [ValidateRange(1, 50)] [int] $Count = 4,
  [string] $Slot,
  [string] $Base = 'origin/main',
  [switch] $Force
)

$ErrorActionPreference = 'Stop'
$PSNativeCommandUseErrorActionPreference = $false   # exit codes are checked by hand
$BasePort = 4300

# git that fails loudly. (Not called `git`: the function would call itself.)
function GitOk {
  $out = & git @args
  if ($LASTEXITCODE -ne 0) { throw "git $($args -join ' ') failed (code $LASTEXITCODE)" }
  $out
}

$first = (GitOk worktree list --porcelain | Select-Object -First 1) -replace '^worktree ', ''
$main = [IO.Path]::GetFullPath($first)
$pool = Join-Path (Split-Path $main -Parent) "$(Split-Path $main -Leaf)-wt"

function SlotNumber([string] $s) {
  if ($s -notmatch '^wt(\d+)$') { throw "Invalid slot: '$s' (expected wtN, e.g. wt2)" }
  [int] $Matches[1]
}

function SlotPath([string] $s) {
  SlotNumber $s | Out-Null
  $path = Join-Path $pool $s
  if (-not (Test-Path $path)) { throw "Slot $s does not exist in $pool (see wt status)" }
  $path
}

function Slots {
  if (-not (Test-Path $pool)) { return }
  Get-ChildItem $pool -Directory | Where-Object Name -Match '^wt\d+$' |
    Sort-Object { [int] $_.Name.Substring(2) }
}

function Branch([string] $path) { git -C $path branch --show-current }   # '' if detached
function Dirty([string] $path) { @(GitOk -C $path status --porcelain) }
function IsFree([string] $path) { -not (Branch $path) -and -not (Dirty $path) }

# `git fetch` only if the base is a remote branch (origin/main); with a local base, nothing.
function Refresh {
  if ($Base -match '^([^/]+)/' -and (git remote) -contains $Matches[1]) {
    GitOk fetch $Matches[1] --quiet
  }
}

# Fingerprint of the dependencies: the lockfile's (or package.json's if there is no lockfile).
function DepsFingerprint([string] $path) {
  $file = 'bun.lock', 'bun.lockb', 'package.json' |
    ForEach-Object { Join-Path $path $_ } | Where-Object { Test-Path $_ } | Select-Object -First 1
  if ($file) { (Get-FileHash $file -Algorithm SHA256).Hash }
}

# The installed fingerprint lives inside node_modules: if someone deletes it, it reinstalls.
# (The marker keeps its pre-3.8.0 name, .wt-huella, so existing slots do not reinstall.)
function Install([string] $path, [switch] $IfChanged) {
  if (-not (Test-Path (Join-Path $path 'package.json'))) { return }
  $marker = Join-Path $path 'node_modules/.wt-huella'
  $fingerprint = DepsFingerprint $path
  if ($IfChanged -and (Test-Path $marker) -and (Get-Content $marker -Raw).Trim() -eq $fingerprint) {
    Write-Host '  = dependencies unchanged: not installing'
    return
  }
  Write-Host "  … bun install in $(Split-Path $path -Leaf)"
  Push-Location $path
  try {
    bun install | Out-Host
    if ($LASTEXITCODE -ne 0) { throw "bun install failed in $path" }
  } finally { Pop-Location }
  if (Test-Path (Join-Path $path 'node_modules')) { Set-Content $marker $fingerprint -NoNewline }
}

function CopyEnv([string] $path) {
  Get-ChildItem $main -Filter '.env*' -File -Force | Where-Object Name -NE '.env.example' |
    ForEach-Object {
      git -C $path check-ignore -q -- $_.Name
      if ($LASTEXITCODE -ne 0) {
        Write-Warning "$($_.Name) is not in .gitignore: not copied (it would get committed)"
        return
      }
      Copy-Item $_.FullName (Join-Path $path $_.Name) -Force
      Write-Host "  + $($_.Name)"
    }
}

# The port belongs to the slot: whatever listens there when taking or freeing it is a server
# the previous unit left (a kill that only killed the shell, a cut-off session). If it stays,
# the next server jumps to another port without warning and lands on another slot's.
function StopServers([string] $s) {
  $port = $BasePort + (SlotNumber $s)
  $pids = if ($IsWindows) {
    Get-NetTCPConnection -LocalPort $port -State Listen -ErrorAction SilentlyContinue |
      Select-Object -ExpandProperty OwningProcess -Unique
  } elseif (Get-Command lsof -ErrorAction SilentlyContinue) {
    lsof -ti "tcp:$port" -sTCP:LISTEN
  }
  foreach ($p in $pids | Where-Object { $_ -gt 0 }) {
    Write-Host "  - orphaned server on port $port (PID $p): stopping it"
    if ($IsWindows) { taskkill /PID $p /T /F | Out-Null } else { kill $p }
  }
}

# The slot's `.qa/` (measuring scripts, suite logs) is never committed. It goes to the repo's
# shared exclude, which applies to every worktree without touching the project's .gitignore.
function ExcludeQa {
  $exclude = Join-Path (Join-Path (GitOk rev-parse --path-format=absolute --git-common-dir) 'info') 'exclude'
  New-Item -ItemType Directory -Force (Split-Path $exclude) | Out-Null
  if (-not (Test-Path $exclude) -or -not (Select-String -LiteralPath $exclude -Pattern '^/?\.qa/$' -Quiet)) {
    Add-Content -LiteralPath $exclude '.qa/'
  }
}

# What the slot's previous unit left that a new one would take as its own. `.qa/.branch`
# records whose they are; when the branch changes, they go:
# - `.qa/pr-body.md`, `.qa/progress.md`, `.qa/*.log`: a Write over the old body failed
#   ("not read"), "when resuming, read progress.md" pointed to another unit, and one
#   `gh pr create --body-file` published another PR's body (KREA ×14). The measuring and
#   repro scripts in `.qa/` stay: they are reused.
# - `.next/dev` and `.next/types`: types of routes the new branch does not have gave false
#   `typecheck` errors (KREA ×5). Next regenerates them.
function ClearLeftovers([string] $path, [string] $branch) {
  $qa = Join-Path $path '.qa'
  $mark = Join-Path $qa '.branch'
  if ((Test-Path $mark) -and ((Get-Content -LiteralPath $mark -Raw).Trim() -eq $branch)) { return }
  if (Test-Path $qa) {
    $old = @(Get-ChildItem -LiteralPath $qa -File | Where-Object { $_.Name -in 'pr-body.md', 'progress.md' -or $_.Extension -eq '.log' })
    if ($old) { $old | Remove-Item -Force; Write-Host "  - .qa/: $($old.Count) file(s) of the previous unit removed (pr-body, progress, logs)" }
  }
  foreach ($d in 'dev', 'types') {
    $p = Join-Path (Join-Path $path '.next') $d
    if (Test-Path $p) { Remove-Item $p -Recurse -Force; Write-Host "  - .next/$d removed (stale route types)" }
  }
  New-Item -ItemType Directory -Force $qa | Out-Null
  Set-Content -LiteralPath $mark $branch
}

function ShowStatus {
  $rows = foreach ($d in Slots) {
    $branch = Branch $d.FullName
    $dirty = [bool] (Dirty $d.FullName)
    [pscustomobject] @{
      Slot   = $d.Name
      Branch = if ($branch) { $branch } elseif ($dirty) { '(detached with changes)' } else { 'free' }
      Dirty  = if ($dirty) { 'yes' } else { 'no' }
      Port   = $BasePort + (SlotNumber $d.Name)
    }
  }
  if (-not $rows) { Write-Host "No slots in $pool. Create the pool with: wt init"; return }
  $rows | Format-Table -AutoSize | Out-Host
}

switch ($Command) {
  'init' {
    Refresh
    ExcludeQa
    New-Item -ItemType Directory -Force $pool | Out-Null
    foreach ($n in 1..$Count) {
      $path = Join-Path $pool "wt$n"
      if (Test-Path $path) { Write-Host "= wt$n already exists, skipped"; continue }
      Write-Host "+ wt$n → $path"
      GitOk worktree add --detach --quiet $path $Base
      Install $path
      CopyEnv $path
    }
    ShowStatus
  }

  'take' {
    if (-not $Name) { throw 'Missing branch: wt take <type/branch> [-Slot wtN]' }
    GitOk check-ref-format --branch $Name | Out-Null
    foreach ($d in Slots) {
      if ((Branch $d.FullName) -eq $Name) { throw "Branch $Name is already in $($d.Name) ($($d.FullName))" }
    }
    if ($Slot) {
      $path = SlotPath $Slot
      if (-not (IsFree $path)) { throw "Slot $Slot is not free (see wt status)" }
    } else {
      $free = Slots | Where-Object { IsFree $_.FullName } | Select-Object -First 1
      if (-not $free) {
        throw "No free slots in $pool. Wait for one to be freed (wt free <wtN>) or grow the pool (wt init -Count <bigger N>)."
      }
      $Slot = $free.Name
      $path = $free.FullName
    }

    Refresh
    ExcludeQa
    StopServers $Slot
    $remote = if ($Base -match '^([^/]+)/') { "$($Matches[1])/$Name" }
    git show-ref --verify --quiet "refs/heads/$Name"
    $existsLocal = $LASTEXITCODE -eq 0
    $existsRemote = $false
    if ($remote) { git show-ref --verify --quiet "refs/remotes/$remote"; $existsRemote = $LASTEXITCODE -eq 0 }

    if ($existsLocal) {
      Write-Host "  = resuming local branch $Name"
      GitOk -C $path switch --quiet $Name
    } elseif ($existsRemote) {
      Write-Host "  = resuming $remote (changes requested on an open PR)"
      GitOk -C $path switch --quiet -c $Name --track $remote
    } else {
      GitOk -C $path switch --quiet -c $Name --no-track $Base
    }
    ClearLeftovers $path $Name
    Install $path -IfChanged
    CopyEnv $path

    "slot=$Slot"
    "branch=$Name"
    "path=$path"
    "port=$($BasePort + (SlotNumber $Slot))"
  }

  'free' {
    $s = if ($Name) { $Name } else { $Slot }
    if (-not $s) { throw 'Missing slot: wt free <wtN>' }
    $path = SlotPath $s
    StopServers $s
    $dirty = Dirty $path
    if ($dirty) {
      throw "Slot $s has uncommitted changes; not freed. Commit and push, or discard them by hand:`n$($dirty -join "`n")"
    }
    $branch = Branch $path
    if ($branch) {
      git -C $path rev-parse --verify --quiet '@{upstream}' | Out-Null
      if ($LASTEXITCODE -eq 0) {
        $unpushed = [int] (GitOk -C $path rev-list --count '@{upstream}..HEAD')
        if ($unpushed) { Write-Warning "$branch has $unpushed unpushed commit(s): the local branch is kept" }
      }
    }
    Refresh
    GitOk -C $path switch --quiet --detach $Base
    if (-not $branch) { Write-Host "$s was already free; it stays on $Base"; return }

    # Merged = it is in the base (normal merge) or its PR shows as merged (squash).
    git merge-base --is-ancestor $branch $Base
    $merged = $LASTEXITCODE -eq 0
    if (-not $merged -and (Get-Command gh -ErrorAction SilentlyContinue)) {
      $merged = (gh pr view $branch --json state --jq .state 2>$null) -eq 'MERGED'
    }
    if (-not $merged) {
      Write-Host "$s free. Branch $branch kept: not merged yet."
    } else {
      git -C $path branch -d $branch 2>&1 | Out-Host   # in the slot: its HEAD is already the base
      if ($LASTEXITCODE -eq 0) {
        Write-Host "$s free. Branch $branch deleted (already merged)."
      } else {
        # Squash + remote branch already pruned: git cannot prove nothing is lost.
        Write-Host "$s free. Branch $branch kept: its PR is merged but git does not see it (squash). If it is not needed, delete it yourself with: git branch -D $branch"
      }
    }
  }

  'status' { ShowStatus }

  'destroy' {
    if (-not $Name) { throw 'Missing slot: wt destroy <wtN> [-Force]' }
    $path = SlotPath $Name
    if (-not (IsFree $path)) { throw "Slot $Name is not free: free it first with wt free $Name" }
    if (-not $Force) {
      try { $r = Read-Host "Delete $Name ($path) with its node_modules? [y/N]" }
      catch { throw 'No console to confirm: repeat with -Force if you really want to delete it.' }
      if ($r -notmatch '^(y|yes|s|si|sí)$') { Write-Host 'Cancelled.'; return }
    }
    # cmd's rmdir deletes node_modules much faster than Remove-Item.
    foreach ($heavy in 'node_modules', '.next') {
      $p = Join-Path $path $heavy
      if (Test-Path $p) {
        if ($IsWindows) { cmd /c "rmdir /s /q `"$p`"" } else { Remove-Item $p -Recurse -Force }
      }
    }
    GitOk worktree remove $path
    Write-Host "- $Name removed"
  }
}
