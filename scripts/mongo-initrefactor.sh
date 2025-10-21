# 1️⃣ Starts MongoDB without authentication (for initialization).
# 2️⃣ Ensures the keyfile is generated only once (persistent across restarts).
# 3️⃣ Waits for MongoDB to fully start (ping check).
# 4️⃣ Checks if the replica set exists (prevents re-initialization).
# 5️⃣ Creates admin user safely (checks if user already exists).
# 6️⃣ Runs any initialization commands.
# 7️⃣ Gracefully stops MongoDB and restarts with authentication enabled.


#!/bin/bash
set -e  # Exit immediately if a command exits with a non-zero status
# ✅ Ensure keyfile persists across restarts
KEYFILE_PATH="/data/db/mongo-keyfile"

if [ ! -f "$KEYFILE_PATH" ]; then
  echo "🔑 Generating MongoDB Keyfile..."
  openssl rand -base64 756 > "$KEYFILE_PATH"
  chmod 600 "$KEYFILE_PATH"
  chown 999:999 "$KEYFILE_PATH"
else
  echo "🔑 Using existing MongoDB Keyfile."
fi


echo "🚀 Starting MongoDB without authentication..."
mongod --replSet rs0 --bind_ip_all --fork --logpath /var/log/mongodb.log --keyFile "$KEYFILE_PATH"


echo "⏳ Waiting for MongoDB to start..."
until mongosh --quiet --eval "db.runCommand({ ping: 1 })" > /dev/null 2>&1; do
  sleep 2
done

echo "⚙️ Checking Replica Set status..."
REPLICA_STATUS=$(mongosh --quiet --eval "try { rs.status().ok } catch (e) { 'not_initialized' }")

if [ "$REPLICA_STATUS" = "not_initialized" ]; then
  echo "🔧 Initializing Replica Set..."
  mongosh --host localhost --quiet --eval "
    rs.initiate({
      _id: 'rs0',
      members: [{ _id: 0, host: 'localhost:27017' }]
    });
  "
  
  # Wait for the replica set to be fully initialized
  echo "⏳ Waiting for Replica Set to initialize..."
  until mongosh --quiet --eval "try { rs.status().myState } catch (e) { 0 }" | grep -q "[12]"; do
    sleep 2
  done
else
  echo "✅ Replica Set already initialized."
fi

echo "👤 Creating admin user..."
mongosh --host localhost --quiet --eval "
  db = db.getSiblingDB('admin');
  if (!db.getUser('admin')) {
    db.createUser({
      user: 'admin',
      pwd: 'adminPassword',
      roles: [{ role: 'root', db: 'admin' }]
    });
  }
"

echo "✅ Admin user created successfully."

echo "⚙️ Running MongoDB initialization commands..."
mongosh --host localhost --username admin --password adminPassword --authenticationDatabase admin --eval "
  print('🚀 Starting MongoDB initialization... 🔑');
  db = db.getSiblingDB('admin');
  print('✅ MongoDB initialization completed.');
"

echo "🔁 Restarting MongoDB with authentication enabled..."
pkill mongod
sleep 5
exec mongod --replSet rs0 --bind_ip_all --auth --keyFile "$KEYFILE_PATH"
