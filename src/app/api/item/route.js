import corsHeaders from "@/lib/cors";
import { getClientPromise } from "@/lib/mongodb";
import { NextResponse } from "next/server";

export async function OPTIONS(req) {
  return new Response(null, {
    status: 200,
    headers: corsHeaders,
  });
}

// GET all items with pagination
export async function GET(req) {
  try {
    const { searchParams } = new URL(req.url);
    const page = parseInt(searchParams.get("page")) || 1;
    const limit = parseInt(searchParams.get("limit")) || 10;
    const skip = (page - 1) * limit;

    const client = await getClientPromise();
    const db = client.db("wad-01");
    
    const items = await db.collection("item").find({}).skip(skip).limit(limit).toArray();
    const total = await db.collection("item").countDocuments();

    return NextResponse.json({
      items,
      total,
      page,
      totalPages: Math.ceil(total / limit)
    }, {
      headers: corsHeaders
    });
  } catch (exception) {
    return NextResponse.json({
      message: exception.toString()
    }, {
      status: 400,
      headers: corsHeaders
    });
  }
}

// POST - Create new item
export async function POST(req) {
  const data = await req.json();
  const itemName = data.itemName;
  const itemCategory = data.itemCategory;
  const itemPrice = data.itemPrice;

  if (!itemName || !itemCategory || !itemPrice) {
    return NextResponse.json({
      message: "Missing mandatory data"
    }, {
      status: 400,
      headers: corsHeaders
    });
  }

  try {
    const client = await getClientPromise();
    const db = client.db("wad-01");
    const result = await db.collection("item").insertOne({
      itemName: itemName,
      itemCategory: itemCategory,
      itemPrice: itemPrice,
      status: "ACTIVE"
    });

    return NextResponse.json({
      id: result.insertedId
    }, {
      status: 200,
      headers: corsHeaders
    });
  } catch (exception) {
    return NextResponse.json({
      message: exception.toString()
    }, {
      status: 400,
      headers: corsHeaders
    });
  }
}
