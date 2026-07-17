import { z } from 'zod';

const zoneValidation = z.object({
    name: z
        .string("Le nom doit être une chaîne")
        .nonempty("Le nom est requis"),

    representantId: z
        .number({
            invalid_type_error: "Ce champ doit être un entier"
        })
        .int("Ce champ doit être un entier")
        .nullish(),

    description: z
        .string("La description doit être une chaîne")
        .optional(),
});

export { zoneValidation };
