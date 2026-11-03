import { z } from "zod";
export const loginSchema = z.object({
  email: z.string().email("Please enter a valid email address"),
  password: z.string().min(1, "Password is required"),
  rememberMe: z.boolean().optional()
});
export const registerSchema = z.object({
  firstName: z.string().min(2, "First name must be at least 2 characters"),
  lastName: z.string().min(2, "Last name must be at least 2 characters"),
  email: z.string().email("Please enter a valid email address"),
  password: z.string().min(8, "Minimum 8 characters").regex(/[A-Z]/, "Must contain at least one uppercase letter").regex(/[a-z]/, "Must contain at least one lowercase letter").regex(/[0-9]/, "Must contain at least one number").regex(/[^A-Za-z0-9]/, "Must contain at least one special character"),
  confirmPassword: z.string().min(1, "Please confirm your password"),
  role: z.enum(["developer", "client"], {
    required_error: "Please select a role"
  }),
  title: z.string().optional(),
  about: z.string().optional(),
  skills: z.string().optional(),
  terms: z.boolean().refine((val) => val === true, {
    message: "You must accept the terms and conditions"
  })
}).refine((data) => data.password === data.confirmPassword, {
  message: "Passwords don't match",
  path: ["confirmPassword"]
});
export const forgotPasswordSchema = z.object({
  email: z.string().email("Please enter a valid email address")
});
export const resetPasswordSchema = z.object({
  password: z.string().min(8, "Minimum 8 characters").regex(/[A-Z]/, "Must contain at least one uppercase letter").regex(/[a-z]/, "Must contain at least one lowercase letter").regex(/[0-9]/, "Must contain at least one number").regex(/[^A-Za-z0-9]/, "Must contain at least one special character"),
  confirmPassword: z.string().min(1, "Please confirm your password")
}).refine((data) => data.password === data.confirmPassword, {
  message: "Passwords don't match",
  path: ["confirmPassword"]
});
export const verifyEmailSchema = z.object({
  otp: z.string().length(6, "OTP must be 6 digits")
});
