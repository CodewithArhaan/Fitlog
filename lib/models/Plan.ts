import mongoose, { Schema } from "mongoose";

const planExerciseSchema = new Schema(
  {
    name: { type: String, required: true, trim: true },
    muscle: { type: String, default: "" },
    sets: { type: Number, default: 3, min: 1 },
    targetReps: { type: String, default: "8-12" },
    restSeconds: { type: Number, default: 90, min: 0 },
  },
  { _id: false },
);

const planSchema = new Schema(
  {
    name: { type: String, required: true, trim: true, unique: true },
    focus: { type: String, default: "Strength" },
    exercises: { type: [planExerciseSchema], default: [] },
  },
  { timestamps: true },
);

const Plan = mongoose.models.Plan ?? mongoose.model("Plan", planSchema);

export default Plan;
