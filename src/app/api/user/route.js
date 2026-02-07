import corsHeaders from "@/lib/cors";
import { getClientPromise } from "@/lib/mongodb";
import { NextResponse } from "next/server";

export async function OPTIONS(req) {
    return new Response(null, {
        status: 200,
        headers: corsHeaders,
    });
}

// GET all users with pagination
export async function GET(req) {
    try {
        const { searchParams } = new URL(req.url);
        const page = parseInt(searchParams.get("page")) || 1;
        const limit = parseInt(searchParams.get("limit")) || 10;
        const skip = (page - 1) * limit;

        const client = await getClientPromise();
        const db = client.db("wad-01");

        const users = await db.collection("user").find({}).skip(skip).limit(limit).toArray();
        const total = await db.collection("user").countDocuments();

        return NextResponse.json({
            users,
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

// POST - Create new user
export async function POST(req) {
    const data = await req.json();
    const email = data.email;
    const firstname = data.firstname;
    const lastname = data.lastname;

    if (!email || !firstname || !lastname) {
        return NextResponse.json({
            message: "Missing mandatory data (email, firstname, lastname required)"
        }, {
            status: 400,
            headers: corsHeaders
        });
    }

    try {
        const client = await getClientPromise();
        const db = client.db("wad-01");

        // Check if user with same email already exists
        const existingUser = await db.collection("user").findOne({ email: email });
        if (existingUser) {
            return NextResponse.json({
                message: "User with this email already exists"
            }, {
                status: 400,
                headers: corsHeaders
            });
        }

        const result = await db.collection("user").insertOne({
            email: email,
            firstname: firstname,
            lastname: lastname,
            status: "ACTIVE",
            createdAt: new Date()
        });

        return NextResponse.json({
            id: result.insertedId,
            message: "User created successfully"
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
