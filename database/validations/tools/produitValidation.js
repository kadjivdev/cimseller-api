import { z } from 'zod';

const produitValidation = z.object({
    name: z
        .string({ error: "Le nom doit être une chaîne" })
        .nonempty("Le nom est requis"),

    typeId: z.preprocess(
        (val) => (val === '' || val === null || val === undefined ? undefined : Number(val)),
        z.number().int("Le type doit être un entier").optional()
    ),

    fournisseurPrice: z.coerce.number({ error: "Ce champ doit être un nombre" })
        .positive("Le prix doit être positif")
        .optional(),

    description: z
        .string({ error: "La description doit être une chaîne" })
        .optional(),
});

export { produitValidation };
