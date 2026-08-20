import { z } from 'zod';

const intField = (label = "Ce champ") =>
    z.coerce.number({
        error: (issue) =>
            issue.input === undefined || issue.input === ""
                ? `${label} est requis`
                : `${label} doit être un entier`,
    }).int(`${label} doit être un entier`);

const numberField = (label = "Ce champ") =>
    z.coerce.number({
        error: (issue) =>
            issue.input === undefined || issue.input === ""
                ? `${label} est requis`
                : `${label} doit être de format numérique`,
    });

// programmations validation schema
const programmationValidation = z.object({
    code: z
        .string({ error: "Ce champ doit être une chaîne de caractères" })
        .optional(),

    commandeId: intField(),

    zoneId: intField(),

    camionId: intField().optional(),

    chauffeurId: intField(),

    avaliseurId: intField().optional(),

    dateProgrammation: z.coerce.date({
        error: (issue) => issue.input === undefined
            ? "La date est requise"
            : "Ce champ doit être une date"
    }),

    qteProgrammer: numberField("La quantité programmée"),

    statutId: intField().nullish(),

    observation: z
        .string({ error: "Ce champ doit être de format string" })
        .optional(),
});

export { programmationValidation };