#!/bin/bash

# MongoDB Setup Script for Replica Set with Authentication

# Load environment variables from .env file if it exists
if [ -f .env ]; then
  echo "📄 Loading configuration from .env file..."
  export $(grep -v '^#' .env | xargs)
fi

# Configuration Variables (with defaults)
MONGO_ROOT_USERNAME=${MONGO_ROOT_USERNAME:-"admin"}
MONGO_ROOT_PASSWORD=${MONGO_ROOT_PASSWORD:-"password"}
MONGO_APP_USERNAME=${MONGO_APP_USERNAME:-"app_user"}
MONGO_APP_PASSWORD=${MONGO_APP_PASSWORD:-"app_password"}
MONGO_DATABASE=${MONGO_DATABASE:-"product_management"}
MONGO_EXPRESS_USERNAME=${MONGO_EXPRESS_USERNAME:-"admin"}
MONGO_EXPRESS_PASSWORD=${MONGO_EXPRESS_PASSWORD:-"admin"}
REPLICA_SET_NAME=${REPLICA_SET_NAME:-"rs0"}

echo "🚀 Setting up MongoDB with Replica Set and Authentication..."

# Check if MongoDB container is already running
if docker compose ps | grep -q "product-management-mongodb"; then
  echo "⚠️  MongoDB container is already running!"
  echo "Do you want to stop and remove existing containers and volumes? (y/N)"
  read -r response
  if [[ "$response" =~ ^[Yy]$ ]]; then
    echo "🛑 Stopping and removing existing containers and volumes..."
    docker compose down -v
  else
    echo "❌ Setup cancelled. Please stop the existing MongoDB container first."
    exit 1
  fi
else
  echo "🛑 Stopping any existing containers..."
  docker compose down -v
fi

# Create MongoDB keyfile if it doesn't exist
if [ ! -f mongodb-keyfile ]; then
  echo "🔑 Creating MongoDB keyfile..."
  openssl rand -base64 756 > mongodb-keyfile
  chmod 400 mongodb-keyfile
fi

# Start MongoDB container
echo "🐳 Starting MongoDB container..."
docker compose up -d mongodb

# Wait for MongoDB to be ready
echo "⏳ Waiting for MongoDB to be ready..."
sleep 10

# Initialize replica set
echo "🔄 Initializing replica set..."
docker exec product-management-mongodb mongosh --eval "
db = db.getSiblingDB('admin');
db.auth('$MONGO_ROOT_USERNAME', '$MONGO_ROOT_PASSWORD');
try {
  rs.initiate({
    _id: '$REPLICA_SET_NAME',
    members: [{ _id: 0, host: 'localhost:27017' }]
  });
  print('Replica set initialized successfully');
} catch (error) {
  print('Replica set might already be initialized: ' + error.message);
}
"

# Wait for replica set to be ready
echo "⏳ Waiting for replica set to be ready..."
sleep 5

# Verify replica set status
echo "🔍 Verifying replica set status..."
docker exec product-management-mongodb mongosh --eval "
db = db.getSiblingDB('admin');
db.auth('$MONGO_ROOT_USERNAME', '$MONGO_ROOT_PASSWORD');
try {
  var status = rs.status();
  if (status.members[0].stateStr === 'PRIMARY') {
    print('✅ Replica set is ready and PRIMARY is healthy');
  } else {
    print('⚠️  Replica set status: ' + status.members[0].stateStr);
  }
} catch (error) {
  print('❌ Error checking replica set status: ' + error.message);
}
"

# Create application user
echo "👤 Creating application user..."
docker exec product-management-mongodb mongosh --eval "
db = db.getSiblingDB('admin');
db.auth('$MONGO_ROOT_USERNAME', '$MONGO_ROOT_PASSWORD');
try {
  db.createUser({
    user: '$MONGO_APP_USERNAME',
    pwd: '$MONGO_APP_PASSWORD',
    roles: [
      { role: 'readWrite', db: '$MONGO_DATABASE' },
      { role: 'dbAdmin', db: '$MONGO_DATABASE' }
    ]
  });
  print('Application user created successfully');
} catch (error) {
  if (error.code === 51003) {
    print('Application user already exists');
  } else {
    print('Error creating user: ' + error.message);
  }
}
"

# Start Mongo Express
echo "🌐 Starting Mongo Express..."
docker compose up -d mongo-express

# Final verification
echo "🔍 Final verification..."
echo "Checking if all containers are running..."
if docker compose ps | grep -q "product-management-mongodb" && docker compose ps | grep -q "product-management-mongo-express"; then
  echo "✅ All containers are running successfully!"
else
  echo "❌ Some containers failed to start. Please check the logs."
  exit 1
fi

echo "✅ MongoDB setup completed!"
echo ""
echo "📊 MongoDB Connection Details:"
echo "   Host: localhost:27017"
echo "   Database: $MONGO_DATABASE"
echo "   Username: $MONGO_APP_USERNAME"
echo "   Password: $MONGO_APP_PASSWORD"
echo "   Replica Set: $REPLICA_SET_NAME"
echo ""
echo "🌐 Mongo Express:"
echo "   URL: http://localhost:8081"
echo "   Username: $MONGO_EXPRESS_USERNAME"
echo "   Password: $MONGO_EXPRESS_PASSWORD"
echo ""
echo "🔗 Application Connection String:"
echo "   mongodb://$MONGO_APP_USERNAME:$MONGO_APP_PASSWORD@localhost:27017/$MONGO_DATABASE?authSource=admin&replicaSet=$REPLICA_SET_NAME"
echo ""
echo "🚀 You can now start your application with: yarn start:dev"
