import corsHeaders from "@/lib/cors";
import { getClientPromise } from "@/lib/mongodb";
import { NextResponse } from "next/server";
import { ObjectId } from "mongodb";
import { writeFile, mkdir } from "fs/promises";
import path from "path";
import crypto from "crypto";

const ALLOWED_MIME_TYPES = [
    "image/jpeg",
    "image/png",
    "image/gif",
    "image/webp",
];

const MIME_TO_EXT = {
    "image/jpeg": ".jpg",
    "image/png": ".png",
    "image/gif": ".gif",
    "image/webp": ".webp",
};

export async function OPTIONS() {
    return new Response(null, {
        status: 200,
        headers: corsHeaders,
    });
}

// POST - Upload profile image
export async function POST(req, { params }) {
    const { id } = await params;

    try {
        // Validate ObjectId
        if (!ObjectId.isValid(id)) {
            return NextResponse.json(
                { message: "Invalid user ID" },
                { status: 400, headers: corsHeaders }
            );
        }

        const formData = await req.formData();
        const file = formData.get("profileImage");

        if (!file || typeof file === "string") {
            return NextResponse.json(
                { message: "No image file provided. Please upload a file using the 'profileImage' field." },
                { status: 400, headers: corsHeaders }
            );
        }

        // Validate file type - only images allowed
        if (!ALLOWED_MIME_TYPES.includes(file.type)) {
            return NextResponse.json(
                {
                    message: `Invalid file type: ${file.type}. Only image files are allowed (JPEG, PNG, GIF, WebP).`,
                },
                { status: 400, headers: corsHeaders }
            );
        }

        // Generate unguessable filename using crypto
        const ext = MIME_TO_EXT[file.type];
        const uniqueName = crypto.randomUUID() + ext;

        // Ensure uploads directory exists in the public folder
        const uploadsDir = path.join(process.cwd(), "public", "uploads");
        await mkdir(uploadsDir, { recursive: true });

        // Write file to disk
        const bytes = await file.arrayBuffer();
        const buffer = Buffer.from(bytes);
        const filePath = path.join(uploadsDir, uniqueName);
        await writeFile(filePath, buffer);

        // The public URL path for Next.js static serving
        const imageUrl = `/uploads/${uniqueName}`;

        // Update user document in MongoDB with the profile image path
        const client = await getClientPromise();
        const db = client.db("wad-01");

        const result = await db.collection("user").updateOne(
            { _id: new ObjectId(id) },
            { $set: { profileImage: imageUrl, updatedAt: new Date() } }
        );

        if (result.matchedCount === 0) {
            return NextResponse.json(
                { message: "User not found" },
                { status: 404, headers: corsHeaders }
            );
        }

        return NextResponse.json(
            {
                message: "Profile image uploaded successfully",
                profileImage: imageUrl,
            },
            { status: 200, headers: corsHeaders }
        );
    } catch (exception) {
        return NextResponse.json(
            { message: exception.toString() },
            { status: 500, headers: corsHeaders }
        );
    }
}
