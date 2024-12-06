import mongoose, { Schema } from "mongoose";
import { IUser } from "./IUser";
import bcrypt from "bcryptjs";

const UserSchema: Schema = new Schema(
  {
    firstName: { type: Schema.Types.String, required: true },
    lastName: { type: Schema.Types.String, required: true },
    phone: { type: Schema.Types.String, required: true },
    ci: { type: Schema.Types.String, required: true },
    email: { type: Schema.Types.String, required: true, unique: true },
    password: { type: Schema.Types.String },
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

// UserSchema.pre<IUser>("save", async function (next) {
//   // if (!this.isModified("password")) {
//   //   return next;
//   // }
//   try {
//     // const salt = await bcrypt.genSalt(10);
//     // this.password = await bcrypt.hash(this.password, salt);
//     this.password = await hashPassword(this.password)
//     next();
//   } catch (error: unknown) {
//     if (error instanceof Error) {
//       next(error);
//     }
//   }
// });
export const UserModel = mongoose.model<IUser>("User", UserSchema);
