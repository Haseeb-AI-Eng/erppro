#!/bin/bash
set -e
mkdir -p /tmp/mongodb/data

# Kill any stale mongod
pkill -x mongod 2>/dev/null || true
sleep 1

# Start MongoDB in background (non-fork so it stays alive with this script)
echo "Starting MongoDB..."
mongod --dbpath /tmp/mongodb/data \
       --logpath /tmp/mongodb/mongod.log \
       --port 27017 --bind_ip 127.0.0.1 \
       --quiet &
MONGO_PID=$!

# Wait for MongoDB to accept connections (use nc to check port)
for i in $(seq 1 20); do
  if nc -z 127.0.0.1 27017 2>/dev/null; then
    echo "MongoDB ready (pid $MONGO_PID)"
    break
  fi
  echo "Waiting for MongoDB... ($i/20)"
  sleep 1
done

# Start ERP backend
echo "Starting ERP backend..."
cd /home/runner/workspace/erp-system/backend
PORT=8080 node src/index.js &
NODE_PID=$!

# Keep script alive — if either process dies, exit
wait -n $MONGO_PID $NODE_PID
echo "A process exited. Shutting down."
kill $MONGO_PID $NODE_PID 2>/dev/null || true
