import { MongoClient, Db } from "mongodb";

// Support both individual env vars and a full DATABASE_URL
const getDatabaseUri = () => {
  if (process.env.DATABASE_URL) {
    return process.env.DATABASE_URL;
  }
  
  const {
    MONGODB_HOST = "localhost",
    MONGODB_PORT = "27017",
    MONGODB_USER,
    MONGODB_PASSWORD,
    MONGODB_DATABASE,
  } = process.env;
  
  return `mongodb://${MONGODB_USER}:${MONGODB_PASSWORD}@${MONGODB_HOST}:${MONGODB_PORT}/${MONGODB_DATABASE}?authSource=admin`;
};

let client: MongoClient;
let db: Db;

export async function connectDB(): Promise<Db> {
  if (db) return db;
  const uri = getDatabaseUri();
  console.log("Connecting to MongoDB...");
  client = new MongoClient(uri);
  await client.connect();
  const dbName = process.env.MONGODB_DATABASE || new URL(uri).pathname.slice(1).split("?")[0];
  db = client.db(dbName);
  return db;
}

export function getDB(): Db {
  if (!db) throw new Error("Database not connected. Call connectDB() first.");
  return db;
}

export async function closeDB(): Promise<void> {
  if (client) {
    await client.close();
  }
}
