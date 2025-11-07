#!/bin/bash

# Check if MongoDB is already initialized (replica set configured and running)
if [ -f /data/db/mongo-initialized ]; then
  echo "✅ MongoDB already initialized. Starting with authentication..."
  exec mongod --replSet rs0 --bind_ip_all --auth --keyFile /data/db/mongo-keyfile
fi

echo "🔑 Generating MongoDB Keyfile..."
openssl rand -base64 756 > /data/db/mongo-keyfile
chmod 600 /data/db/mongo-keyfile
chown 999:999 /data/db/mongo-keyfile

echo "🚀 Starting MongoDB without authentication..."
mongod --replSet rs0 --bind_ip_all --fork --logpath /var/log/mongodb.log

echo "⏳ Waiting for MongoDB to start..."
sleep 10

echo "⚙️ Checking/Initiating Replica Set..."
mongosh --host localhost --eval "
  try {
    const status = rs.status();
    print('Replica set already initialized');
  } catch (error) {
    if (error.codeName === 'NotYetInitialized') {
      print('Initializing replica set...');
      rs.initiate({
        _id: 'rs0',
        members: [{ _id: 0, host: 'mongo:27017' }]
      });
    } else {
      print('Error checking replica set status:', error);
    }
  }
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

echo "👤 Creating admin user (if not exists)..."
mongosh --host localhost --eval "
  db = db.getSiblingDB('admin');
  const existingUser = db.getUser('admin');
  if (!existingUser) {
    db.createUser({
      user: 'admin',
      pwd: 'adminPassword',
      roles: [{ role: 'root', db: 'admin' }]
    });
    print('✅ Admin user created successfully.');
  } else {
    print('✅ Admin user already exists.');
  }
"

echo "⚙️ Running MongoDB initialization script..."
mongosh --host localhost --username admin --password adminPassword --authenticationDatabase admin --eval "load('/docker-entrypoint-initdb.d/mongo-init.js')"

# Mark initialization as complete
echo "✅ Creating initialization marker..."
touch /data/db/mongo-initialized

echo "🔁 Restarting MongoDB with authentication enabled..."
mongod --shutdown
sleep 5
exec mongod --replSet rs0 --bind_ip_all --auth --keyFile /data/db/mongo-keyfile
