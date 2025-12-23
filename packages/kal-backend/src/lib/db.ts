import { MongoClient, Db } from "mongodb";

const {
  MONGODB_HOST = "localhost",
  MONGODB_PORT = "27017",
  MONGODB_USER,
  MONGODB_PASSWORD,
  MONGODB_DATABASE,
} = process.env;

const uri = `mongodb://${MONGODB_USER}:${MONGODB_PASSWORD}@${MONGODB_HOST}:${MONGODB_PORT}/${MONGODB_DATABASE}?authSource=admin`;

let client: MongoClient;
let db: Db;

export async function connectDB(): Promise<Db> {
  if (db) return db;
  client = new MongoClient(uri);
  await client.connect();
  db = client.db(MONGODB_DATABASE);
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
