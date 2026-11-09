#!/bin/sh
# apps/kita/database/scripts/provision-cluster.sh — T-PLAT-02 executable isolation
#
# Creates/destroys an EPHEMERAL, loopback-only PostgreSQL cluster for the Kita
# core smoke tests WITHOUT touching any system database service:
#
#   - data dir:  apps/kita/database/.cluster/  (gitignored, destroyed by `down`)
#   - port:      54339 (Kita isolated-test convention; never the default 5432)
#   - database:  kita_core_test
#   - login:     role kita_test (TEST-ONLY credentials; no real secrets here)
#
# The cluster is started with pg_ctl under the invoking user — no systemd, no
# init.d, no `service`, no package installation, no writes outside .cluster/.
#
# REQUIREMENTS: PostgreSQL *server* binaries (initdb, pg_ctl, postgres,
# createdb, psql). As of 2026-11-09 these are NOT present on this host — only
# client tooling may be. This script deliberately does NOT install anything.
# To provision the binaries yourself (operator action, out of band):
#   Debian/Ubuntu:  sudo apt-get update && sudo apt-get install -y postgresql
#                   (binaries then live in /usr/lib/postgresql/<ver>/bin/)
#   macOS (brew):   brew install postgresql@16 && export PATH="$(brew --prefix postgresql@16)/bin:$PATH"
#
# USAGE:
#   scripts/provision-cluster.sh up      # initdb (if needed) + start + create db/role
#   scripts/provision-cluster.sh down    # stop cluster and DELETE .cluster/ data dir
#   scripts/provision-cluster.sh status  # show whether the ephemeral cluster runs
#
# Teardown note for callers: a foreground runner (e.g. smoke.mjs wrappers)
# should register a trap so the cluster comes down on exit, e.g.:
#   trap 'scripts/provision-cluster.sh down' EXIT INT TERM
#
# Related files owned by coder-07 (do not create here): migrate.mjs applies
# apps/kita/sql/001_core.sql; smoke.mjs (src/) runs 002_core_smoke.sql against
# what this script provisions.

set -eu

SCRIPT_DIR=$(CDPATH= cd -- "$(dirname -- "$0")" && pwd)
DB_DIR=$(CDPATH= cd -- "$SCRIPT_DIR/.." && pwd)
CLUSTER_DIR="$DB_DIR/.cluster"
PORT=54339
DB_NAME=kita_core_test
DB_ROLE=kita_test
SOCK_DIR="$CLUSTER_DIR/run"
LOG_FILE="$CLUSTER_DIR/cluster.log"

say() { printf '%s\n' "$*"; }
die() { printf 'provision-cluster: %s\n' "$*" >&2; exit 1; }

# Locate server binaries: PATH first, then Debian's versioned bindir (highest
# installed version wins). We never install; we only look.
find_bin() {
    _name=$1
    if command -v "$_name" >/dev/null 2>&1; then
        command -v "$_name"
        return 0
    fi
    if [ -x "$(ls -d /usr/lib/postgresql/*/bin/"$_name" 2>/dev/null | sort -V | tail -n 1)" ] 2>/dev/null; then
        ls -d /usr/lib/postgresql/*/bin/"$_name" | sort -V | tail -n 1
        return 0
    fi
    return 1
}

need_bins() {
    INITDB=$(find_bin initdb) || die "initdb not found. PostgreSQL server binaries are NOT installed on this host (as of 2026-11-09). Install them per the header comment (apt-get install -y postgresql / brew install postgresql@16); this script will not install anything for you."
    PGCTL=$(find_bin pg_ctl) || die "pg_ctl not found — see the initdb hint above."
    CREATEDB=$(find_bin createdb) || die "createdb not found — install postgresql-client too."
    PSQL=$(find_bin psql) || die "psql not found — install postgresql-client too."
}

is_running() {
    "$PGCTL" -D "$CLUSTER_DIR/data" status >/dev/null 2>&1
}

ensure_gitignore() {
    # Keep the ephemeral data dir out of git without editing shared files
    # outside apps/kita (repo-root .gitignore is owned elsewhere).
    [ -f "$CLUSTER_DIR/.gitignore" ] || printf '# ephemeral postgres cluster — never commit\n*\n' > "$CLUSTER_DIR/.gitignore"
}

do_up() {
    need_bins

    case "$DB_ROLE" in
        *[!a-z0-9_]*) die "refusing unexpected role name $DB_ROLE" ;;
    esac

    if [ ! -d "$CLUSTER_DIR/data" ]; then
        say "initdb -> $CLUSTER_DIR/data (loopback-only, port $PORT)"
        mkdir -p "$CLUSTER_DIR/data" "$SOCK_DIR"
        ensure_gitignore
        # Trust auth on loopback only: TEST cluster, throwaway data, no real
        # credentials. Never replicate these flags into a production deployment.
        "$INITDB" -D "$CLUSTER_DIR/data" -U "$DB_ROLE" --auth=trust --no-sync >/dev/null
        {
            printf "port = %s\n" "$PORT"
            printf "listen_addresses = '127.0.0.1'\n"
            printf "unix_socket_directories = '%s'\n" "$SOCK_DIR"
            printf "fsync = off\nfull_page_writes = off\n"   # speed only; data is disposable
        } >> "$CLUSTER_DIR/data/postgresql.conf"
    else
        ensure_gitignore
        mkdir -p "$SOCK_DIR"
    fi

    if is_running; then
        say "cluster already running on 127.0.0.1:$PORT"
    else
        say "starting cluster (log: $LOG_FILE)"
        "$PGCTL" -D "$CLUSTER_DIR/data" -l "$LOG_FILE" -o "-c listen_addresses=127.0.0.1 -p $PORT" -w start >/dev/null
    fi

    # Role: initdb -U creates kita_test as superuser of THIS cluster only; the
    # smoke fixture's runtime roles (kita_api/kita_worker/kita_posting) and the
    # kita schema come from 001_core.sql, applied by coder-07's migrate.mjs.
    # Idempotent re-run path:
    if ! "$PSQL" -h 127.0.0.1 -p "$PORT" -U "$DB_ROLE" -d postgres -tAc \
        "SELECT 1 FROM pg_roles WHERE rolname='$DB_ROLE'" | grep -q 1; then
        say "creating login role $DB_ROLE"
        "$PSQL" -h 127.0.0.1 -p "$PORT" -U postgres -qc "CREATE ROLE $DB_ROLE LOGIN" >/dev/null || \
            die "could not create role $DB_ROLE"
    fi

    if ! "$PSQL" -h 127.0.0.1 -p "$PORT" -U "$DB_ROLE" -d postgres -tAc \
        "SELECT 1 FROM pg_database WHERE datname='$DB_NAME'" | grep -q 1; then
        say "creating database $DB_NAME"
        "$PSQL" -h 127.0.0.1 -p "$PORT" -U "$DB_ROLE" -d postgres -qc \
            "CREATE DATABASE $DB_NAME OWNER $DB_ROLE" >/dev/null || \
            die "could not create database $DB_NAME"
    fi

    say ""
    say "Isolated test cluster ready. Point tools at:"
    say "  postgres://$DB_ROLE@127.0.0.1:$PORT/$DB_NAME"
    say "e.g."
    say "  export DATABASE_URL=postgres://$DB_ROLE@127.0.0.1:$PORT/$DB_NAME"
    say "  node $DB_DIR/src/migrate.mjs   # coder-07 owns migrate.mjs"
    say "  node $DB_DIR/src/smoke.mjs"
    say ""
    say "Tear everything down (data destroyed) with: $0 down"
}

do_down() {
    # Trap-friendly teardown: stop the cluster if running, then delete the
    # whole .cluster/ dir. Safe even if initdb never completed.
    # Stop the cluster if it was ever initialized; pg_ctl status fails harmlessly
    # when not running, and everything below is best-effort.
    if PGCTL=$(find_bin pg_ctl 2>/dev/null) && [ -d "$CLUSTER_DIR/data" ]; then
        "$PGCTL" -D "$CLUSTER_DIR/data" -m immediate -w stop >/dev/null 2>&1 || true
    fi
    if [ -d "$CLUSTER_DIR" ]; then
        # Guard: only ever delete our own dot-dir directly under apps/kita/database.
        case "$CLUSTER_DIR" in
            */apps/kita/database/.cluster) rm -rf "$CLUSTER_DIR" ;;
            *) die "refusing to remove unexpected path $CLUSTER_DIR" ;;
        esac
        say "removed $CLUSTER_DIR (all test data destroyed)"
    else
        say "nothing to tear down ($CLUSTER_DIR absent)"
    fi
}

do_status() {
    need_bins
    if [ -d "$CLUSTER_DIR/data" ] && is_running; then
        say "running: 127.0.0.1:$PORT, data in $CLUSTER_DIR/data"
    elif [ -d "$CLUSTER_DIR/data" ]; then
        say "initialized but stopped ($CLUSTER_DIR/data exists)"
    else
        say "not provisioned (run: $0 up)"
    fi
}

case "${1:-up}" in
    up) do_up ;;
    down) do_down ;;
    status) do_status ;;
    *) die "usage: $0 {up|down|status}" ;;
esac
