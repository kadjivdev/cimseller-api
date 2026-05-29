import { z } from 'zod';

const avaliseurValidation = z.object({
    fullname: z
        .string("Le nom doit être une chaîne")
        .optional(),

    phone: z
        .string("Le phone doit être de type string")
        .optional(),

    email: z
        .string("L'email doit être de type string")
        .optional(),
});

export { avaliseurValidation };
