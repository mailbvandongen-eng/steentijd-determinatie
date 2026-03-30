#!/usr/bin/env bash

set -euo pipefail

usage() {
  echo "Usage: $0 --staged | --range <base> <head>" >&2
  exit 2
}

if [[ $# -eq 1 && "$1" == "--staged" ]]; then
  diff_cmd=(git diff --cached --name-only --diff-filter=ACMR)
  version_diff_cmd=(git diff --cached --quiet -- app/src/App.tsx app/package.json)
elif [[ $# -eq 3 && "$1" == "--range" ]]; then
  base="$2"
  head="$3"
  diff_cmd=(git diff --name-only --diff-filter=ACMR "$base" "$head")
  version_diff_cmd=(git diff --quiet "$base" "$head" -- app/src/App.tsx app/package.json)
else
  usage
fi

mapfile -t changed_files < <("${diff_cmd[@]}")

if [[ ${#changed_files[@]} -eq 0 ]]; then
  exit 0
fi

requires_bump=0
for file in "${changed_files[@]}"; do
  case "$file" in
    app/src/App.tsx|app/package.json)
      ;;
    .github/*|.githooks/*|scripts/*|*.md|.gitignore)
      ;;
    *)
      requires_bump=1
      break
      ;;
  esac
done

if [[ $requires_bump -eq 0 ]]; then
  exit 0
fi

if ! "${version_diff_cmd[@]}"; then
  old_app_version=$(git show "${base:-HEAD}:app/src/App.tsx" 2>/dev/null | sed -n "s/^const APP_VERSION = '\([^']*\)';$/\1/p" | head -n 1 || true)
  new_app_version=$(sed -n "s/^const APP_VERSION = '\([^']*\)';$/\1/p" app/src/App.tsx | head -n 1 || true)
  package_version=$(sed -n 's/  "version": "\([^"]*\)",/\1/p' app/package.json | head -n 1 || true)

  if [[ -z "$new_app_version" || -z "$package_version" ]]; then
    echo "Version check failed: could not read version from app/src/App.tsx or app/package.json." >&2
    exit 1
  fi

  if [[ "$new_app_version" != "$package_version" ]]; then
    echo "Version check failed: app/src/App.tsx ($new_app_version) and app/package.json ($package_version) do not match." >&2
    exit 1
  fi

  if [[ -n "$old_app_version" && "$old_app_version" == "$new_app_version" ]]; then
    echo "Version check failed: project files changed, but app version stayed at $new_app_version." >&2
    exit 1
  fi

  exit 0
fi

echo "Version check failed: project files changed without updating both app/src/App.tsx and app/package.json." >&2
echo "Bump the version before committing or pushing." >&2
exit 1
