import { z } from 'zod';

const banqueValidation = z.object({
    name: z
        .string("Le nom doit être une chaîne")
        .nonempty("Le nom est requis"),

    description: z
        .string("La description doit être une chaîne")
        .optional(),
});

export { banqueValidation };
