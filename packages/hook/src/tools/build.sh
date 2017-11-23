for file in ./test/fixtures/*
do
  if test -d $file
  then
    (cd $file && npm install)
  fi
done
