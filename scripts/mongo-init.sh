#!/bin/bash

echo "🔑 Generating MongoDB Keyfile..."
openssl rand -base64 756 > /data/db/mongo-keyfile
chmod 600 /data/db/mongo-keyfile
chown 999:999 /data/db/mongo-keyfile

echo "🚀 Starting MongoDB without authentication..."
mongod --replSet rs0 --bind_ip_all --fork --logpath /var/log/mongodb.log

echo "⏳ Waiting for MongoDB to start..."
sleep 10

echo "⚙️ Initiating Replica Set..."
mongosh --host localhost --eval "
  rs.initiate({
    _id: 'rs0',
    members: [{ _id: 0, host: 'mongo:27017' }]
  });
"

echo "⏳ Waiting for Replica Set to be ready..."
sleep 10  # Ensure the replica set is fully configured before proceeding

echo "🔧 Validating Replica Set configuration..."
mongosh --host localhost --eval "
  try {
    const cfg = rs.conf();
    const member = cfg.members.find(({ _id }) => _id === 0);
    if (member && member.host !== 'mongo:27017') {
      member.host = 'mongo:27017';
      rs.reconfig(cfg, { force: true });
      print('Replica set host updated to mongo:27017');
    } else {
      print('Replica set host already set to mongo:27017');
    }
  } catch (error) {
    print('Replica set configuration check skipped:', error);
  }
"

echo "👤 Creating admin user before enabling authentication..."
mongosh --host localhost --eval "
  db = db.getSiblingDB('admin');
  db.createUser({
    user: 'admin',
    pwd: 'adminPassword',
    roles: [{ role: 'root', db: 'admin' }]
  });
"

echo "✅ Admin user created successfully."

echo "⚙️ Running MongoDB initialization script..."
mongosh --host localhost --username admin --password adminPassword --authenticationDatabase admin --eval "load('/docker-entrypoint-initdb.d/mongo-init.js')"

echo "🔁 Restarting MongoDB with authentication enabled..."
mongod --shutdown
sleep 5
exec mongod --replSet rs0 --bind_ip_all --auth --keyFile /data/db/mongo-keyfile
