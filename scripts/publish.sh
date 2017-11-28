echo ">>>>>> copy readme to pandora/readme"
cp README.md ./package/pandora/README.md
source `dirname $0`/build.sh
git add .
lerna publish $* --conventional-commits
