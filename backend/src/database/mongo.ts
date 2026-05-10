import mongoose, { Schema } from "mongoose";

const SolutionStepSchema = new Schema({
  stepNumber: Number,
  symbolicStep: String,
  explanation: String,
});

const EquationHistorySchema = new Schema({
  latex: { type: String, required: true },
  equationType: String,
  solverUsed: String,
  resultLatex: String,
  steps: [SolutionStepSchema],
  saved: { type: Boolean, default: false },
  userId: { type: String, index: true },
}, { timestamps: true });

export const EquationHistory = mongoose.models.EquationHistory ||
  mongoose.model("EquationHistory", EquationHistorySchema);

export async function connectMongo() {
  const uri = process.env.MONGO_URI;
  if (!uri) return;
  if (mongoose.connection.readyState === 0) await mongoose.connect(uri);
}
