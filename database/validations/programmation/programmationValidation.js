import { z } from 'zod';

// programmations validation schema
const programmationValidation = z.object({
    code: z
        .string({ error: "Ce champ doit être une chaîne de caractères" })
        .optional(),

    commandeId: z.int({
        error: (issue) => issue.input === undefined
            ? "Ce champ est requis"
            : "Ce champ doit être un entier"
    }),

    zoneId: z.int({
        error: (issue) => issue.input === undefined
            ? "Ce champ est requis"
            : "Ce champ doit être un entier"
    }),

    camionId: z.int({
        error: (issue) => issue.input === undefined
            ? "Ce champ est requis"
            : "Ce champ doit être un entier"
    }).optional(),

    chauffeurId: z.int({
        error: (issue) => issue.input === undefined
            ? "Ce champ est requis"
            : "Ce champ doit être un entier"
    }),

    avaliseurId: z.int({
        error: (issue) => issue.input === undefined
            ? "Ce champ est requis"
            : "Ce champ doit être un entier"
    }).optional(),

    dateProgrammation: z.coerce.date({
        error: (issue) => issue.input === undefined
            ? "La date est requise"
            : "Ce champ doit être une date"
    }),

    qteProgrammer: z.number({
        error: (issue) => issue.input === undefined
            ? "Ce champ est requis"
            : "Ce champ doit être de format numérique"
    }),

    statutId: z
        .number({ error: "Ce champ doit être un entier" })
        .int("Ce champ doit être un entier")
        .nullish(),

    observation: z
        .string({ error: "Ce champ doit être de format string" })
        .optional(),
});

export { programmationValidation };