import { coerce, z } from "zod";

export const submitApplicationSchema = z.object({
  // --- Personal Info ---
  fullName: z
    .string()
    .min(3, { message: "Full name must be at least 3 characters." })
    .max(100, { message: "Full name must not exceed 100 characters." }),

  dateOfBirth: z.coerce
    .date()
    .refine((dob) => {
      const age = new Date().getFullYear() - dob.getFullYear();
      return age >= 18;
    }, { message: "You must be at least 18 years old." })
    .refine((dob) => {
      const age = new Date().getFullYear() - dob.getFullYear();
      return age <= 80;
    }, { message: "Invalid date of birth." }),

  nationalIdNumber: z
    .string()
    .min(5, { message: "National ID must be at least 5 characters." })
    .optional(),


  // --- Qualifications ---
  highestDegree: z.enum(["diploma", "bachelor", "master", "phd", "other"], {
    message: "Invalid degree. Must be diploma, bachelor, master, phd, or other.",
  }),

  fieldOfStudy: z
    .string()
    .min(2, { message: "Field of study must be at least 2 characters." })
    .max(100, { message: "Field of study must not exceed 100 characters." }),

  institution: z
    .string()
    .min(2, { message: "Institution name must be at least 2 characters." })
    .max(150, { message: "Institution name must not exceed 150 characters." }),

  graduationYear: z.coerce
    .number()
    .int()
    .min(1970, { message: "Graduation year must be 1970 or later." })
    .max(new Date().getFullYear(), {
      message: "Graduation year cannot be in the future.",
    })
    .optional(),

  // --- Teaching Details ---
subjectsTaught: z.union([
  z.array(z.string().min(1)),
  z.string().min(1).transform((val) => [val]), // if only one item sent
]).refine((arr) => arr.length >= 1, { message: "At least one subject is required." })
 .refine((arr) => arr.length <= 10, { message: "You can add up to 10 subjects only." }),

    

  
teachingLanguages: z.union([
  z.array(z.string().min(1,{ message: "Language name cannot be empty." })),
  z.string().min(1).transform((val) => [val]),
]).default(["English"]), 

  yearsOfExperience: z.
    coerce.number()
    .int()
    .min(0, { message: "Years of experience cannot be negative." })
    .max(50, { message: "Years of experience seems invalid." }),

  experience: z
    .string()
    .min(100, { message: "Experience description must be at least 100 characters." })
    .max(2000, { message: "Experience description must not exceed 2000 characters." }),

  
});


export type SubmitApplicationInput = z.infer<typeof submitApplicationSchema>;