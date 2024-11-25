import mongoose, { Schema, Types } from "mongoose";
import { IRole } from "./IRole";

const RoleSchema: Schema = new Schema(
  {
    name: {
      type: Schema.Types.String,
      required: true,
      unique: true,
    },
  },
  {
    collection: "Roles",
  }
);
export const RoleModel = mongoose.model<IRole>("Role", RoleSchema);
