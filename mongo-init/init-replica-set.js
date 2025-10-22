// MongoDB Replica Set Initialization Script
// This script sets up the replica set and creates the application database with user

print("Starting MongoDB initialization...");

// Wait for MongoDB to be ready
sleep(5000);

// Check if replica set is already initialized
try {
  var status = rs.status();
  print("Replica set already initialized");
} catch (error) {
  print("Initializing replica set...");
  
  // Initialize replica set
  try {
    rs.initiate({
      _id: "rs0",
      members: [
        { _id: 0, host: "localhost:27017" }
      ]
    });
    print("Replica set initialized successfully");
    
    // Wait for replica set to be ready
    sleep(5000);
  } catch (initError) {
    print("Error initializing replica set: " + initError.message);
  }
}

// Switch to admin database to create user
db = db.getSiblingDB('admin');

// Create application database user
try {
  db.createUser({
    user: "app_user",
    pwd: "app_password",
    roles: [
      { role: "readWrite", db: "product_management" },
      { role: "dbAdmin", db: "product_management" }
    ]
  });
  print("Application user created successfully");
} catch (error) {
  if (error.code === 51003) {
    print("Application user already exists");
  } else {
    print("Error creating user: " + error.message);
  }
}

// Switch to application database
db = db.getSiblingDB('product_management');

// Create collections with indexes
try {
  // Products collection
  if (!db.getCollectionNames().includes('products')) {
    db.createCollection('products');
    print("Products collection created");
  }
  
  // Create indexes for products
  db.products.createIndex({ "title": 1 });
  db.products.createIndex({ "type": 1 });
  db.products.createIndex({ "status": 1 });
  db.products.createIndex({ "collectionId": 1 });
  db.products.createIndex({ "createdAt": -1 });
  
  // SKUs collection
  if (!db.getCollectionNames().includes('skus')) {
    db.createCollection('skus');
    print("SKUs collection created");
  }
  
  // Create indexes for SKUs
  db.skus.createIndex({ "productId": 1 });
  db.skus.createIndex({ "variantCombination": 1 });
  
  // Collections collection
  if (!db.getCollectionNames().includes('collections')) {
    db.createCollection('collections');
    print("Collections collection created");
  }
  
  // Create indexes for collections
  db.collections.createIndex({ "name": 1 });
  db.collections.createIndex({ "slug": 1 });
  db.collections.createIndex({ "isActive": 1 });
  db.collections.createIndex({ "metadata.category": 1 });
  db.collections.createIndex({ "metadata.brand": 1 });
  db.collections.createIndex({ "createdAt": -1 });
  
  print("Collections and indexes created successfully");
} catch (error) {
  print("Error creating collections: " + error.message);
}

print("MongoDB initialization completed successfully");