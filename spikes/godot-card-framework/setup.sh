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
cp ../../assets/hollow-battle.webp assets/
cwebp -quiet -resize 420 0 -q 86 ../../assets/creepy-woods.webp -o assets/draw-pile-woods.webp
for asset in hudson quinn alba tita fox hare badger owl raccoon magpie boar wolf mouse squirrel frog weasel hedgehog bat crow heron otter mole porcupine skunk coyote beaver turtle salamander viper moth lynx stag bear wolverine; do
  cwebp -quiet -resize 160 0 -q 83 "../../assets/$asset.webp" -o "assets/$asset.webp"
done
