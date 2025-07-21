import { MongoClient, Db } from 'mongodb'

const uri = process.env.MONGODB_URI
if (!uri) throw new Error('Please define the MONGODB_URI environment variable')

let cachedClient: MongoClient | null = null
let cachedDb: { [key: string]: Db } = {}

export async function connectToDatabase(dbName: string): Promise<Db> {
  if (cachedClient && cachedDb[dbName]) {
    return cachedDb[dbName]
  }

  if (!cachedClient) {
    cachedClient = new MongoClient(uri!) // Non-null assertion
    await cachedClient.connect()
  }

  if (!cachedDb[dbName]) {
    cachedDb[dbName] = cachedClient.db(dbName)
  }

  return cachedDb[dbName]
} 