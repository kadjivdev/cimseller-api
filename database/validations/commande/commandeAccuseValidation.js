import { z } from 'zod';

// commande-accuse validation schema
const commandeAccuseValidation = z.object({

    commandeId: z.coerce
        .number("Ce champ doit être un entier")
        .int("Ce champ doit être un entier"),

    code: z
        .string("Ce champ doit être un string")
        .nullish(),

    reference: z
        .string("Ce champ doit être un string")
        .nullish(),

    libelle: z
        .string("Ce champ doit être un string")
        .nullish(),

    date: z.coerce.date({
        error: (issue) => issue.input === undefined
            ? "La date est requise"
            : "Ce champ doit être une date"
    }),

    montant: z.coerce.number({
        error: (issue) => issue.input === undefined
            ? "Le montant est requis"
            : "Ce champ doit être de format numérique"
    }),

    preuve: z
        .string("La preuve doit être une chaîne")
        .nullish(),

    typeDocumentId: z.coerce
        .number("Ce champ doit être un entier")
        .int("Ce champ doit être un entier")
        .nullish(),
});

export { commandeAccuseValidation };
