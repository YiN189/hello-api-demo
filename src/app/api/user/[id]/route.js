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

// GET single user
export async function GET(req, { params }) {
    const { id } = await params;

    try {
        const client = await getClientPromise();
        const db = client.db("wad-01");
        const result = await db.collection("user").findOne({ _id: new ObjectId(id) });

        if (!result) {
            return NextResponse.json({ message: "User not found" }, { status: 404, headers: corsHeaders });
        }

        return NextResponse.json(result, { headers: corsHeaders });
    } catch (exception) {
        return NextResponse.json({ message: exception.toString() }, { status: 400, headers: corsHeaders });
    }
}

// PATCH - Update user
export async function PATCH(req, { params }) {
    const { id } = await params;
    const data = await req.json();

    const partialUpdate = {};
    if (data.email != null) partialUpdate.email = data.email;
    if (data.firstname != null) partialUpdate.firstname = data.firstname;
    if (data.lastname != null) partialUpdate.lastname = data.lastname;
    if (data.status != null) partialUpdate.status = data.status;

    if (Object.keys(partialUpdate).length === 0) {
        return NextResponse.json({ message: "No fields to update" }, { status: 400, headers: corsHeaders });
    }

    try {
        const client = await getClientPromise();
        const db = client.db("wad-01");

        // Check if email is being updated and already exists
        if (partialUpdate.email) {
            const existingUser = await db.collection("user").findOne({
                email: partialUpdate.email,
                _id: { $ne: new ObjectId(id) }
            });
            if (existingUser) {
                return NextResponse.json({ message: "Email already in use" }, { status: 400, headers: corsHeaders });
            }
        }

        const result = await db.collection("user").updateOne(
            { _id: new ObjectId(id) },
            { $set: { ...partialUpdate, updatedAt: new Date() } }
        );

        if (result.matchedCount === 0) {
            return NextResponse.json({ message: "User not found" }, { status: 404, headers: corsHeaders });
        }

        return NextResponse.json({ message: "User updated successfully", ...result }, { status: 200, headers: corsHeaders });
    } catch (exception) {
        return NextResponse.json({ message: exception.toString() }, { status: 400, headers: corsHeaders });
    }
}

// DELETE - Delete user
export async function DELETE(req, { params }) {
    const { id } = await params;

    try {
        const client = await getClientPromise();
        const db = client.db("wad-01");
        const result = await db.collection("user").deleteOne({ _id: new ObjectId(id) });

        if (result.deletedCount === 0) {
            return NextResponse.json({ message: "User not found" }, { status: 404, headers: corsHeaders });
        }

        return NextResponse.json({ message: "User deleted successfully", deletedCount: result.deletedCount }, { status: 200, headers: corsHeaders });
    } catch (exception) {
        return NextResponse.json({ message: exception.toString() }, { status: 400, headers: corsHeaders });
    }
}
