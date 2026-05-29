import { z } from 'zod';

const camionValidation = z.object({

    marqueId: z
        .number({
            invalid_type_error: "Ce champ doit être un entier"
        })
        .int("Ce champ doit être un entier")
        .nullish(),

    libelle: z
        .string("Le libellé doit être une chaîne")
        .optional(),

    immatriculation: z
        .string("La description doit être une chaîne")
        .optional(),
});

export { camionValidation };
