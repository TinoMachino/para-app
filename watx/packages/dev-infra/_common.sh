#!/usr/bin/env sh

# Exit if any command fails
set -e

get_container_id() {
  local compose_file=$1
  local service=$2
  if [ -z "${compose_file}" ] || [ -z "${service}" ]; then
    echo "usage: get_container_id <compose_file> <service>"
    exit 1
  fi

 # first line of jq normalizes for docker compose breaking change, see docker/compose#10958
  docker compose --file $compose_file ps --format json --status running \
    | jq -sc '.[] | if type=="array" then .[] else . end' | jq -s \
    | jq -r '.[]? | select(.Service == "'${service}'") | .ID'
}

get_container_health() {
  local container_id=$1
  if [ -z "${container_id}" ]; then
    echo "missing"
    return
  fi

  local health_status
  health_status=$(docker inspect --format '{{if .State.Health}}{{.State.Health.Status}}{{else}}none{{end}}' "${container_id}" 2>/dev/null || echo "missing")
  echo "${health_status}"
}

docker_is_usable() {
  docker ps >/dev/null 2>&1 &
  local pid=$!
  local waited=0

  while [ ${waited} -lt 8 ]; do
    if ! kill -0 ${pid} >/dev/null 2>&1; then
      wait ${pid}
      return $?
    fi
    sleep 1
    waited=$((waited + 1))
  done

  kill -9 ${pid} >/dev/null 2>&1 || true
  wait ${pid} >/dev/null 2>&1 || true
  return 1
}

# Exports all environment variables
export_env() {
  export_pg_env
  export_redis_env
}

# Exports postgres environment variables
export_pg_env() {
  # Based on creds in compose.yaml
  export PGHOST=localhost
  export PGUSER=pg
  export PGPASSWORD=password
  export PGDATABASE=postgres
  export DB_POSTGRES_URL="postgresql://pg:password@127.0.0.1:5432/postgres"
  export DB_TEST_POSTGRES_URL="postgresql://pg:password@127.0.0.1:5433/postgres"
}

# Exports redis environment variables
export_redis_env() {
  export REDIS_HOST="127.0.0.1:6379"
  export REDIS_TEST_HOST="127.0.0.1:6380"
}

select_runtime_pg_env() {
  local services=$1
  if [[ $services == *"db_test"* ]]; then
    export PGPORT=5433
  else
    export PGPORT=5432
  fi
}

select_runtime_urls() {
  local services=$1
  local postgres_url_env_var=`[[ $services == *"db_test"* ]] && echo "DB_TEST_POSTGRES_URL" || echo "DB_POSTGRES_URL"`
  local redis_host_env_var=`[[ $services == *"redis_test"* ]] && echo "REDIS_TEST_HOST" || echo "REDIS_HOST"`

  select_runtime_pg_env "${services}"

  postgres_url="${!postgres_url_env_var}"
  redis_host="${!redis_host_env_var}"
}

pg_clear() {
  local pg_uri=$1

  for schema_name in `psql "${pg_uri}" -c "SELECT schema_name FROM information_schema.schemata WHERE schema_name NOT LIKE 'pg_%' AND schema_name NOT LIKE 'information_schema';" -t`; do
    psql "${pg_uri}" -c "DROP SCHEMA \"${schema_name}\" CASCADE;"
  done
}

pg_init() {
  local pg_uri=$1

  psql "${pg_uri}" -c "CREATE SCHEMA IF NOT EXISTS \"public\";"
}

redis_clear() {
  local redis_uri=$1
  redis-cli -u "${redis_uri}" flushall
}

main_native() {
  export_env

  local services=${SERVICES}
  select_runtime_urls "${services}"
  local postgres_url_env_var=`[[ $services == *"db_test"* ]] && echo "DB_TEST_POSTGRES_URL" || echo "DB_POSTGRES_URL"`
  local redis_host_env_var=`[[ $services == *"redis_test"* ]] && echo "REDIS_TEST_HOST" || echo "REDIS_HOST"`

  if [ -n "${postgres_url}" ]; then
    echo "Using ${postgres_url_env_var} (${postgres_url}) to connect to postgres."
    pg_init "${postgres_url}"
  else
    echo "Postgres connection string missing did you set ${postgres_url_env_var}?"
    exit 1
  fi

  if [ -n "${redis_host}" ]; then
    echo "Using ${redis_host_env_var} (${redis_host}) to connect to Redis."
  else
    echo "Redis connection string missing did you set ${redis_host_env_var}?"
    echo "Continuing without Redis..."
  fi

  cleanup() {
    local services=$@

    if [ -n "${redis_host}" ] && [[ $services == *"redis_test"* ]]; then
      redis_clear "redis://${redis_host}" &> /dev/null
    fi

    if [ -n "${postgres_url}" ] && [[ $services == *"db_test"* ]]; then
      pg_clear "${postgres_url}" &> /dev/null
    fi
  }

  # trap SIGINT and performs cleanup
  trap "on_sigint ${services}" INT
  on_sigint() {
    cleanup $@
    exit $?
  }

  # Run the arguments as a command
  DB_POSTGRES_URL="${postgres_url}" \
  REDIS_HOST="${redis_host}" \
  "$@"
  code=$?

  cleanup ${services}

  exit ${code}
}

main_docker() {
  # Expect a SERVICES env var to be set with the docker service names
  local services=${SERVICES}

  dir=$(dirname $0)
  compose_file="${dir}/docker-compose.yaml"

  # whether this particular script started the container(s)
  started_container=false

  # performs cleanup as necessary, i.e. taking down containers
  # if this script started them
  cleanup() {
    local services=$@
    echo # newline
    if $started_container; then
      if [[ $services == *"db_test"* ]] || [[ $services == *"redis_test"* ]]; then
        docker compose --file $compose_file rm --force --stop --volumes ${services}
      fi
    fi
  }

  # trap SIGINT and performs cleanup
  trap "on_sigint ${services}" INT
  on_sigint() {
    cleanup $@
    exit $?
  }

  # check if all services are running and healthy already
  needs_recreate=false
  for service in $services; do
    container_id=$(get_container_id $compose_file $service)
    if [ -z $container_id ]; then
      needs_recreate=true
      break
    fi

    health=$(get_container_health $container_id)
    if [ "${health}" != "none" ] && [ "${health}" != "healthy" ]; then
      needs_recreate=true
      break
    fi
  done

  # if any are missing/unhealthy, recreate all services
  if $needs_recreate; then
    started_container=true
    if [[ $services == *"db_test"* ]] || [[ $services == *"redis_test"* ]]; then
      docker compose --file $compose_file rm --force --stop --volumes ${services} >/dev/null 2>&1 || true
    else
      docker compose --file $compose_file rm --force --stop ${services} >/dev/null 2>&1 || true
    fi
    docker compose --file $compose_file up --wait --force-recreate ${services}
  else
    echo "all services ${services} are already running"
  fi

  # do not exit when following commands fail, so we can intercept exit code & tear down docker
  set +e

  # setup environment variables and run args
  export_env
  select_runtime_urls "${services}"
  DB_POSTGRES_URL="${postgres_url}" \
  REDIS_HOST="${redis_host}" \
  "$@"
  # save return code for later
  code=$?

  # performs cleanup as necessary
  cleanup ${services}
  exit ${code}
}

# Main entry point
main() {
  if ! command -v docker >/dev/null 2>&1; then
    echo "Docker CLI unavailable. Running on host."
    if ! command -v psql >/dev/null 2>&1; then
      echo "Host fallback unavailable: psql is required but not installed."
      exit 1
    fi
    main_native $@
  elif ! docker_is_usable; then
    echo "Docker is unavailable or unresponsive. Running on host."
    echo "If you expected Docker mode, restart Docker Desktop and retry."
    if ! command -v psql >/dev/null 2>&1; then
      echo "Host fallback unavailable: psql is required but not installed."
      exit 1
    fi
    main_native $@
  elif ! docker ps >/dev/null 2>&1; then
    echo "Docker unavailable. Running on host."
    if ! command -v psql >/dev/null 2>&1; then
      echo "Host fallback unavailable: psql is required but not installed."
      exit 1
    fi
    main_native $@
  else
    main_docker $@
  fi
}
