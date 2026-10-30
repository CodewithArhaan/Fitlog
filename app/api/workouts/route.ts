import { NextResponse } from "next/server";
import dbConnect from "@/lib/mongodb";
import Workout from "@/lib/models/Workout";

export async function GET() {
  try {
    await dbConnect();
    const workouts = await Workout.find().sort({ date: -1 }).limit(100).lean();
    return NextResponse.json({ workouts });
  } catch {
    return NextResponse.json({ error: "Unable to load workouts." }, { status: 503 });
  }
}

export async function POST(request: Request) {
  try {
    const body = await request.json();
    if (typeof body.title !== "string" || !body.title.trim() || !Array.isArray(body.exercises)) {
      return NextResponse.json({ error: "A workout title and exercise list are required." }, { status: 400 });
    }

    await dbConnect();
    const workout = await Workout.create({
      title: body.title.trim(),
      date: body.date ? new Date(body.date) : new Date(),
      durationMinutes: Math.max(0, Number(body.durationMinutes) || 0),
      volume: Math.max(0, Number(body.volume) || 0),
      notes: typeof body.notes === "string" ? body.notes.slice(0, 2000) : "",
      exercises: body.exercises,
    });
    return NextResponse.json({ workout }, { status: 201 });
  } catch {
    return NextResponse.json({ error: "Unable to save workout." }, { status: 503 });
  }
}

export async function DELETE(request: Request) {
  const searchParams = new URL(request.url).searchParams;
  const deleteAll = searchParams.get("all") === "true";
  const id = searchParams.get("id");

  if ((deleteAll && id) || (!deleteAll && (!id || !/^[a-f\d]{24}$/i.test(id)))) {
    return NextResponse.json({ error: "A valid workout ID or all=true is required." }, { status: 400 });
  }

  try {
    await dbConnect();
    if (deleteAll) {
      const result = await Workout.deleteMany({});
      return NextResponse.json({ deletedCount: result.deletedCount });
    }

    const workout = await Workout.findByIdAndDelete(id);
    if (!workout) return NextResponse.json({ error: "Workout not found." }, { status: 404 });
    return NextResponse.json({ deleted: true });
  } catch {
    return NextResponse.json({ error: "Unable to delete workout history." }, { status: 503 });
  }
}
