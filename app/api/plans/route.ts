import { NextResponse } from "next/server";
import dbConnect from "@/lib/mongodb";
import Plan from "@/lib/models/Plan";

export async function GET() {
  try {
    await dbConnect();
    const plans = await Plan.find().sort({ updatedAt: -1 }).limit(100).lean();
    return NextResponse.json({ plans });
  } catch {
    return NextResponse.json({ error: "Unable to load routines." }, { status: 503 });
  }
}

export async function POST(request: Request) {
  try {
    const body = await request.json();
    if (typeof body.name !== "string" || !body.name.trim() || !Array.isArray(body.exercises)) {
      return NextResponse.json({ error: "A routine name and exercise list are required." }, { status: 400 });
    }

    await dbConnect();
    const plan = await Plan.findOneAndUpdate(
      { name: body.name.trim() },
      { name: body.name.trim(), focus: body.focus, exercises: body.exercises },
      { new: true, upsert: true, runValidators: true, setDefaultsOnInsert: true },
    );
    return NextResponse.json({ plan }, { status: 200 });
  } catch {
    return NextResponse.json({ error: "Unable to save routine." }, { status: 503 });
  }
}
