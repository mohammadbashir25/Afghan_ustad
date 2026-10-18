import { z } from "zod";
export const studentRegistrationSchema = z.object({
  name: z.string().trim().min(2).max(100),
  fatherName: z.string().trim().min(2).max(120),
  whatsappNumber: z.string().trim().min(7).max(32).regex(/^\+?[0-9 ()-]+$/, "Enter a valid WhatsApp number."),
  username: z.string().trim().toLowerCase().min(3).max(24).regex(/^[a-z0-9._-]+$/, "Use letters, numbers, dots, underscores, or hyphens."),
  pin: z.string().regex(/^\d{4,8}$/, "Student PIN must contain 4 to 8 digits."),
  courseId: z.string().regex(/^[a-f\d]{24}$/i, "Select a valid course."),
  classId: z.string().regex(/^[a-f\d]{24}$/i, "Select a valid class.").optional(),
  amountPaid: z.coerce.number().finite().min(0),
  discountAmount: z.coerce.number().finite().min(0),
  method: z.enum(["CASH", "BANK", "MOBILE_MONEY", "OTHER"]),
});
