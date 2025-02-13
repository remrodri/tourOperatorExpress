import { model, Schema } from "mongoose";
import { ICancellationPolicy } from "./ICancellationPolicy";

const cancellationPolicySchema: Schema = new Schema(
  {
    name: { type: Schema.Types.String, required: true },
    deadLine: { type: Schema.Types.Number, required: true },
    refoundPercentage: { type: Schema.Types.Number, required: true },
    description: { type: Schema.Types.String, required: true },
    deleted: { type: Schema.Types.Boolean, default: false },
  },
  {
    timestamps: true,
    collection: "Cancellation_Policy",
  }
);
export const CancellationPolicyModel = model<ICancellationPolicy>(
  "CancellationPolicy",
  cancellationPolicySchema
);
