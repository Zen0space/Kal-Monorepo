import { z } from "zod";

// Food Entry Schemas
export const CreateFoodEntrySchema = z.object({
  name: z.string().min(1, "Name is required").max(100),
  calories: z.number().positive("Calories must be positive"),
  protein: z.number().min(0).optional(),
  carbs: z.number().min(0).optional(),
  fat: z.number().min(0).optional(),
  date: z.date().optional(),
});

export const UpdateFoodEntrySchema = CreateFoodEntrySchema.partial();

export const GetEntriesSchema = z.object({
  date: z.date().optional(),
  startDate: z.date().optional(),
  endDate: z.date().optional(),
  page: z.number().min(1).default(1),
  pageSize: z.number().min(1).max(100).default(20),
});

export const DeleteEntrySchema = z.object({
  id: z.string().min(1),
});

// Infer types from schemas
export type CreateFoodEntry = z.infer<typeof CreateFoodEntrySchema>;
export type UpdateFoodEntry = z.infer<typeof UpdateFoodEntrySchema>;
export type GetEntriesInput = z.infer<typeof GetEntriesSchema>;
