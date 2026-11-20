import { Types } from "mongoose";
import { z } from "zod";

const optionalObjectId = z
  .string()
  .trim()
  .optional()
  .refine((value) => !value || Types.ObjectId.isValid(value), {
    message: "Identificador inválido",
  })
  .transform((value) => value || undefined);

const ISO_DATE_PATTERN =
  /^\d{4}-\d{2}-\d{2}(?:T\d{2}:\d{2}:\d{2}(?:\.\d{1,3})?(?:Z|[+-]\d{2}:\d{2}))?$/;

const optionalDate = z
  .string()
  .trim()
  .optional()
  .refine(
    (value) =>
      !value ||
      (ISO_DATE_PATTERN.test(value) && !Number.isNaN(Date.parse(value))),
    {
      message: "Fecha inválida; use ISO-8601 o YYYY-MM-DD",
    },
  )
  .transform((value) => value || undefined);

export const analyticsCommonFilterShape = {
  from: optionalDate,
  to: optionalDate,
  tourPackageId: optionalObjectId,
  destinationId: optionalObjectId,
  dateRangeId: optionalObjectId,
};

export const analyticsCommonFilterObject = z.object(analyticsCommonFilterShape);

export type AnalyticsCommonFilterInput = z.infer<
  typeof analyticsCommonFilterObject
>;

export const refineAnalyticsFilters = (
  value: AnalyticsCommonFilterInput,
  context: z.RefinementCtx,
): void => {
  if (Boolean(value.from) !== Boolean(value.to)) {
    context.addIssue({
      code: z.ZodIssueCode.custom,
      path: [value.from ? "to" : "from"],
      message: "from y to deben enviarse juntos",
    });
    return;
  }

  if (
    value.from &&
    value.to &&
    new Date(value.from).getTime() > new Date(value.to).getTime()
  ) {
    context.addIssue({
      code: z.ZodIssueCode.custom,
      path: ["from"],
      message: "from no puede ser posterior a to",
    });
  }
};

export const normalizeAnalyticsFilters = <
  T extends AnalyticsCommonFilterInput,
>(
  value: T,
) => ({
  ...value,
  from: value.from ? new Date(value.from).toISOString() : undefined,
  to: value.to ? new Date(value.to).toISOString() : undefined,
});
