import { z } from 'zod';

// commande-recu-versement validation schema
const commandeRecuVersementValidation = z.object({

    recuId: z.coerce
        .number("Ce champ doit être un entier")
        .int("Ce champ doit être un entier"),

    compteId: z.coerce.number({
        error: (issue) => issue.input === undefined
            ? "Ce champ est requis"
            : "Ce champ doit être un entier"
    }).int("Ce champ doit être un entier"),

    typeDetailRecuId: z.coerce.number({
        error: (issue) => issue.input === undefined
            ? "Ce champ est requis"
            : "Ce champ doit être un entier"
    }).int("Ce champ doit être un entier"),

    code: z
        .string("Ce champ doit être un string")
        .nullish(),

    reference: z
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
});

export { commandeRecuVersementValidation };