import mongoose, { Schema } from "mongoose";

const setSchema = new Schema(
  {
    weight: { type: Number, default: 0 },
    reps: { type: Number, default: 0 },
    completed: { type: Boolean, default: false },
  },
  { _id: false },
);

const exerciseSchema = new Schema(
  {
    name: { type: String, required: true, trim: true },
    muscle: { type: String, default: "" },
    sets: { type: [setSchema], default: [] },
  },
  { _id: false },
);

const workoutSchema = new Schema(
  {
    title: { type: String, required: true, trim: true },
    date: { type: Date, required: true, default: Date.now },
    durationMinutes: { type: Number, default: 0, min: 0 },
    volume: { type: Number, default: 0, min: 0 },
    notes: { type: String, default: "", maxlength: 2000 },
    exercises: { type: [exerciseSchema], default: [] },
  },
  { timestamps: true },
);

const Workout = mongoose.models.Workout ?? mongoose.model("Workout", workoutSchema);

export default Workout;
