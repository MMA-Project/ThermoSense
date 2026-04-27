import { z } from "zod";

export const UserSchema = z.object({
  id: z.string().cuid(),
  email: z.string().email(),
  password: z.string(),
  name: z.string().optional(),
  role: z.string(),
  zoneIds: z.array(z.string().cuid()),
  createdAt: z.date(),
  updatedAt: z.date(),
});

export type User = z.infer<typeof UserSchema>;

export const CreateUserSchema = UserSchema.pick({
  email: true,
  password: true,
  name: true,
}).extend({
  role: z.string().optional(),
  zoneIds: z.array(z.string().cuid()).optional(),
});

export type CreateUser = z.infer<typeof CreateUserSchema>;

export const LoginSchema = UserSchema.pick({
  email: true,
  password: true,
});

export type Login = z.infer<typeof LoginSchema>;
