#!/bin/sh
# Run every suite and judge it on four things, not one.
#
# Each of these has burned this project at least once:
#   exit code    - four suites report a bug by printing it; they now tally and exit 1
#   output       - a suite can print "3 issue(s)" and still exit 0 if that tally breaks
#   check count  - a suite that half-runs prints fewer checks and looks fine
#   file size    - `open(f,"w")` truncates before its argument is evaluated, so a
#                  failed write leaves a 0-byte file, and an empty suite exits 0
#
# Usage:  sh test/run.sh          from the repo root
#         sh run.sh               from inside test/
#         sh test/run.sh reg fc   just those
set -u
cd "$(dirname "$0")"

# suite:minimum checks it must print to be believed
SUITES="reg:9 blitz:14 qa2:16 qa3:15 verify:24 fc:11 loot:10 a2:22 rules:24"
MIN_BYTES=3000

want="${*:-}"
pass=0; fail=0; total=0
for entry in $SUITES; do
  s=${entry%:*}; min=${entry#*:}
  # exact names only -- a substring match would make "qa2" also run "a2"
  if [ -n "$want" ]; then
    hit=0
    for w in $want; do [ "$w" = "$s" ] && hit=1; done
    [ "$hit" -eq 1 ] || continue
  fi

  if [ ! -f "$s.js" ]; then
    printf '  %-10s MISSING\n' "$s.js"; fail=$((fail+1)); continue
  fi
  bytes=$(wc -c < "$s.js" | tr -d ' ')
  out=$(node "$s.js" 2>&1); rc=$?
  checks=$(printf '%s\n' "$out" | grep -cE '^[[:space:]]*(ok|PASS)([[:space:]]|$)')
  markers=$(printf '%s\n' "$out" | grep -cE '\bBUG\b|\bFAIL\b|not ok|\bERROR\b|(^|[[:space:]])[1-9][0-9]* issue')

  why=""
  [ "$rc" -eq 0 ]            || why="$why exit=$rc"
  [ "$markers" -eq 0 ]       || why="$why markers=$markers"
  [ "$checks" -ge "$min" ]   || why="$why checks=$checks<$min"
  [ "$bytes" -ge "$MIN_BYTES" ] || why="$why bytes=$bytes"

  if [ -z "$why" ]; then
    printf '  %-10s PASS  %3s checks\n' "$s.js" "$checks"
    pass=$((pass+1)); total=$((total+checks))
  else
    printf '  %-10s FAIL %s\n' "$s.js" "$why"
    printf '%s\n' "$out" | tail -20 | sed 's/^/      /'
    fail=$((fail+1))
  fi
done

echo
if [ "$fail" -eq 0 ]; then
  echo "$pass suite(s) pass, $total checks"
else
  echo "$fail suite(s) FAILED, $pass passed"
fi
[ "$fail" -eq 0 ]
