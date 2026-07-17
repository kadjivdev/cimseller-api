import { z } from 'zod';

// fournisseur validation schema
const fournisseurValidation = z.object({
    sigle: z
        .string("Le nom complet doit être une chaîne")
        .optional(),

    raison_sociale: z
        .string("Le nom complet doit être une chaîne")
        .optional(),

    phone: z
        .string({ error: "Le telephone doit être une chaîne" })
        .optional(),

    email: z.preprocess(
        (val) => (val === '' || val === null || val === undefined ? undefined : String(val)),
        z.string("L'email doit être une chaîne")
            .optional()
    ),

    adresse: z
        .string("L'adresse doit être une chaîne")
        .optional(),
});

export { fournisseurValidation };