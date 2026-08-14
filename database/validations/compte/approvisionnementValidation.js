import { z } from 'zod';

// approvisionnement validation schema
const approvisionnementValidation = z.object({

    clientId: z.coerce.number({ error: "Ce champ doit être un entier" })
        .int("Ce champ doit être un entier"),

    compteBancaireId: z.coerce.number({ error: "Ce champ doit être un entier" })
        .int("Ce champ doit être un entier"),

    typeDetailRecuId: z.coerce.number({ error: "Ce champ doit être un entier" })
        .int("Ce champ doit être un entier"),

    code: z
        .string({ error: "Ce champ doit être un string" })
        .nullish(),

    reference: z
        .string({ error: "Ce champ doit être un string" })
        .nullish(),

    montant: z.coerce.number({ error: "Le montant est requis et doit être numérique" }),

    date: z.coerce.date({ error: "La date est requise et doit être valide" })
        .refine((val) => val <= new Date(), {
            message: "La date ne peut pas être postérieure à aujourd'hui",
        }),

    preuve: z
        .string({ error: "La preuve doit être une chaîne" })
        .nullish(),

    comment: z
        .string({ error: "Le commentaire doit être une chaîne de caractères" })
        .nullish(),

    validationComment: z
        .string({ error: "Le commentaire doit être une chaîne de caractères" })
        .nullish(),
});

export { approvisionnementValidation };