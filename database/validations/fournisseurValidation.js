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
        .string("Le telephone doit être une chaîne")
        .optional(),

    email: z
        .email("L'email doit être une chaîne")
        .optional(),

    adresse: z
        .string("L'adresse doit être une chaîne")
        .optional(),
});

export { fournisseurValidation };