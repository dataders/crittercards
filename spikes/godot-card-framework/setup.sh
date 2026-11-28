#!/bin/sh
set -eu
cd "$(dirname "$0")"
revision=a74b713863adb27a22965a8e6ed039d0c4016791
scratch=$(mktemp -d)
trap 'rm -rf "$scratch"' EXIT
curl -fsSL "https://codeload.github.com/chun92/card-framework/tar.gz/$revision" -o "$scratch/framework.tar.gz"
tar -xzf "$scratch/framework.tar.gz" -C "$scratch"
mkdir -p addons assets
cp -R "$scratch/card-framework-$revision/addons/card-framework" addons/
for asset in hollow-battle badger hudson; do
  cp "../../assets/$asset.webp" assets/
done
