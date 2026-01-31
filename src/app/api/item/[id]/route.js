import corsHeaders from "@/lib/cors";
import { getClientPromise } from "@/lib/mongodb";
import { NextResponse } from "next/server";
import { ObjectId } from "mongodb";

export async function OPTIONS() {
  return new Response(null, {
    status: 200,
    headers: corsHeaders,
  });
}

// GET single item
export async function GET(req, { params }) {
  const { id } = await params;

  try {
    const client = await getClientPromise();
    const db = client.db("wad-01");
    const result = await db.collection("item").findOne({ _id: new ObjectId(id) });

    return NextResponse.json(result, { headers: corsHeaders });
  } catch (exception) {
    return NextResponse.json({ message: exception.toString() }, { status: 400, headers: corsHeaders });
  }
}

// PATCH - Update item
export async function PATCH(req, { params }) {
  const { id } = await params;
  const data = await req.json();

  const partialUpdate = {};
  if (data.itemName != null) partialUpdate.itemName = data.itemName;
  if (data.itemCategory != null) partialUpdate.itemCategory = data.itemCategory;
  if (data.itemPrice != null) partialUpdate.itemPrice = data.itemPrice;
  if (data.status != null) partialUpdate.status = data.status;

  try {
    const client = await getClientPromise();
    const db = client.db("wad-01");
    const result = await db.collection("item").updateOne(
      { _id: new ObjectId(id) },
      { $set: partialUpdate }
    );

    return NextResponse.json(result, { status: 200, headers: corsHeaders });
  } catch (exception) {
    return NextResponse.json({ message: exception.toString() }, { status: 400, headers: corsHeaders });
  }
}

// DELETE - Delete item
export async function DELETE(req, { params }) {
  const { id } = await params;

  try {
    const client = await getClientPromise();
    const db = client.db("wad-01");
    const result = await db.collection("item").deleteOne({ _id: new ObjectId(id) });

    return NextResponse.json({ message: "Deleted", deletedCount: result.deletedCount }, { status: 200, headers: corsHeaders });
  } catch (exception) {
    return NextResponse.json({ message: exception.toString() }, { status: 400, headers: corsHeaders });
  }
}
