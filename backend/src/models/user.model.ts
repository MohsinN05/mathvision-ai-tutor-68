import mongoose, { Document, Schema } from "mongoose";

export interface IUser extends Document {
  email: string;
  name?: string;
  passwordHash: string;
  emailVerified: boolean;
  verifyToken?: string;
  verifyExpires?: Date;
  createdAt: Date;
  updatedAt: Date;
}

const UserSchema = new Schema<IUser>(
  {
    email: { type: String, required: true, unique: true, index: true },
    name: { type: String, default: "" },
    passwordHash: { type: String, required: true },
    emailVerified: { type: Boolean, default: false },
    verifyToken: { type: String },
    verifyExpires: { type: Date },
  },
  { timestamps: true }
);

export const User = mongoose.models.User || mongoose.model<IUser>("User", UserSchema);
