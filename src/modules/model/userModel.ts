import mongoose, { Schema } from "mongoose";
import { IUser } from "./IUser";

const UserSchema: Schema = new Schema(
  {
    firstName: { type: Schema.Types.String, required: true },
    lastName: { type: Schema.Types.String, required: true },
    phone: { type: Schema.Types.String, required: true },
    ci: { type: Schema.Types.String, required: true },
    email: { type: Schema.Types.String, required: true, unique: true },
    password: { type: Schema.Types.String, required: true },
    deleted: { type: Schema.Types.Boolean, default: false },
    firstLogin: { type: Schema.Types.Boolean, default: true },
    role: { type: Schema.Types.ObjectId, ref: "Role", required: true },
    questionsAnswers: {
      type: Schema.Types.ObjectId,
      ref: "UserQuestionsAnswers",
    },
  },
  {
    timestamps: true,
    collection: "Users",
  }
);
export const UserModel = mongoose.model<IUser>("User", UserSchema);
