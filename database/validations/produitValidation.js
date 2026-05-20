import { z } from 'zod';

const produitValidation = z.object({
    name: z
        .string("Le nom doit être une chaîne")
        .nonempty("Le nom est requis"),

    typeId: z.preprocess(
        (val) => (val === '' || val === null || val === undefined ? undefined : Number(val)),
        z.number().int("Le type doit être un entier").optional()
    ),

    image: z
        .string("L'image doit être une chaîne")
        .optional(),

    description: z
        .string("La description doit être une chaîne")
        .optional(),
});

export { produitValidation };
