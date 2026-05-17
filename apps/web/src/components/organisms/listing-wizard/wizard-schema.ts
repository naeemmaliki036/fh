import { z } from "zod";

const PURPOSES = ["sale", "rent_short", "rent_long"] as const;
const RENT_PERIODS = ["daily", "weekly", "monthly", "quarterly", "yearly"] as const;
const TIERS = ["standard", "premium", "featured"] as const;

export const wizardSchema = z
  .object({
    property_id: z.string().min(1, "Property required"),
    purpose: z.enum(PURPOSES),
    rent_period: z.enum(RENT_PERIODS).optional().nullable(),
    valid_from: z.string().optional().nullable(),
    valid_until: z.string().optional().nullable(),
    price: z
      .string()
      .min(1, "Price required")
      .regex(/^\d+$/, "Whole number only (no decimals)")
      .refine((s) => Number(s) > 0, "Must be a positive number"),
    currency: z.string().min(1),
    listing_tier: z.enum(TIERS).default("standard"),
    title: z.string().min(2, "Title required"),
    short_description: z.string().max(250).optional().nullable(),
    description: z.string().optional().nullable(),
    tags: z.array(z.string()).optional().nullable(),
  })
  .superRefine((v, ctx) => {
    if (v.valid_from && v.valid_until && v.valid_until < v.valid_from) {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        path: ["valid_until"],
        message: "Must be on or after start date",
      });
    }
    const todayIso = new Date().toISOString().slice(0, 10);
    if (v.valid_from && v.valid_from < todayIso) {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        path: ["valid_from"],
        message: "Valid From cannot be in the past",
      });
    }
  });

export type WizardFormValues = z.infer<typeof wizardSchema>;

export const STEP_COUNT = 7;

export type WizardStep = 1 | 2 | 3 | 4 | 5 | 6 | 7;

export const STEP_LABELS: Record<WizardStep, string> = {
  1: "Property",
  2: "Purpose",
  3: "Pricing",
  4: "Content",
  5: "Media",
  6: "Documents",
  7: "Review",
};
