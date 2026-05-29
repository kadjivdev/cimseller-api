import { z } from 'zod';

// programmations validation schema
const programmationValidation = z.object({
    code: z
        .string("Ce champ doit être un entier")
        .optional(),

    commandeId: z
        .int({
            required_error: "Ce champ est réquis",
            invalid_type_error: "Ce champ doit être un entier"
        }),


    zoneId: z
        .int({
            required_error: "Ce champ est réquis",
            invalid_type_error: "Ce champ doit être un entier"
        }),

    camionId: z
        .int({
            required_error: "Ce champ est réquis",
            invalid_type_error: "Ce champ doit être un entier"
        })
        .optional(),

    chauffeurId: z
        .int({
            required_error: "Ce champ est réquis",
            invalid_type_error: "Ce champ doit être un entier"
        }),

    avaliseurId: z
        .int({
            required_error: "Ce champ est réquis",
            invalid_type_error: "Ce champ doit être un entier"
        }).optional(),

    dateProgrammation: z.coerce.date({
        invalid_type_error: "Ce champ doit être une date",
        required_error: "La date est requise"
    }),

    qteProgrammer: z
        .number({
            required_error: "Ce champ est réquis",
            invalid_type_error: "Ce champ doit être de format numérique"
        }),

    statutId: z
        .number({
            invalid_type_error: "Ce champ doit être un entier"
        })
        .int("Ce champ doit être un entier")
        .nullish(),

    observation: z
        .string("Ce champ doit être de format string")
        .optional(),
});

export { programmationValidation };