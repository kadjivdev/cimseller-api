import { z } from 'zod';

// reglement validation schema
const reglementValidation = z.object({

    venteId: z.coerce.number({ error: "Ce champ doit être un entier" })
        .int("Ce champ doit être un entier"),

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

    deblocDette: z.preprocess(
        (val) => {
            if (val === 'true' || val === true) return true
            if (val === 'false' || val === false) return false
            if (val === '' || val === null || val === undefined) return undefined
            return val
        },
        z.boolean({ error: "Le champ deblocDette doit être un booléen" }).nullish()
    ),
});

export { reglementValidation };