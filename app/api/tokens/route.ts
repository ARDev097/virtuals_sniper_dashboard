import { NextRequest, NextResponse } from 'next/server'
import { connectToDatabase } from '../mongodb'
import { mockTokens } from '../mock-data'

export async function GET(req: NextRequest) {
  try {
    let personas: any[] = []
    try {
      const db = await connectToDatabase('virtualgenesis')
      personas = await db.collection('personas').find({}).toArray()
    } catch (e) {
      // DB not available, fallback to mock
    }
    return NextResponse.json(personas.length > 0 ? personas : mockTokens)
  } catch (error) {
    return NextResponse.json(mockTokens)
  }
} 