#!/usr/bin/env bash
set -euo pipefail

ROOT="$(cd "$(dirname "$0")/.." && pwd)"
SITE="$ROOT/_site"

echo "==> 清理输出目录"
rm -rf "$SITE"
mkdir -p "$SITE"

echo "==> 复制门户静态资源"
cp "$ROOT/index.html" "$ROOT/manifest.json" "$ROOT/sw.js" "$SITE/"
cp -r "$ROOT/css" "$ROOT/js" "$ROOT/icons" "$SITE/"

build_app() {
  local name="$1"
  echo "==> 构建 $name"
  (cd "$ROOT/$name" && npm ci && npm run build)
  cp -r "$ROOT/$name/dist" "$SITE/$name"
}

build_app "habit-tracker-pwa"
build_app "image-hub-pwa"
build_app "my-things-pwa"

echo "==> 构建完成: $SITE"
find "$SITE" -maxdepth 2 -type f | head -20
