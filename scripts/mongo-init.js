// Wait for MongoDB to start before initiating the replica set
print('🚀 Starting MongoDB initialization... 🔑');

// Connect to the `admin` database
db = db.getSiblingDB('admin');

// Authenticate before running commands
db.auth('admin', 'adminPassword');

// Create application database
// const appDb = db.getSiblingDB('myAppDB');
// appDb.createUser({
//   user: 'appUser',
//   pwd: 'appUserPassword',
//   roles: [{ role: 'readWrite', db: 'myAppDB' }]
// });

// appDb.createCollection('users');
// appDb.createCollection('tasks');

// appDb.users.insertMany([
//   { username: 'testuser1', email: 'test1@example.com' },
//   { username: 'testuser2', email: 'test2@example.com' }
// ]);

// appDb.tasks.insertMany([
//   { title: 'Task 1', status: 'pending' },
//   { title: 'Task 2', status: 'completed' }
// ]);

print('✅ MongoDB initialization completed.');
