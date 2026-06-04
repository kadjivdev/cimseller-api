import { z } from 'zod';

// ventes validation schema
const comptabilityValidation = z.object({
    venteId: z
        .int({
            required_error: "Ce champ est réquis",
            invalid_type_error: "Ce champ doit être de format numérique"
        }).optional(),

    aib: z
        .number({
            required_error: "Ce champ est réquis",
            invalid_type_error: "Ce champ doit être un nombre"
        })
        .optional(),

    tva: z
        .number({
            required_error: "Ce champ est réquis",
            invalid_type_error: "Ce champ doit être un nombre"
        })
        .optional(),

    ttcPrice: z
        .number({
            required_error: "Ce champ est réquis",
            invalid_type_error: "Ce champ doit être un nombre"
        })
        .optional(),

    marge: z
        .number({
            required_error: "Ce champ est réquis",
            invalid_type_error: "Ce champ doit être un nombre"
        })
        .optional(),

    senderToComptability: z
        .int({
            required_error: "Ce champ est réquis",
            invalid_type_error: "Ce champ doit être un entier"
        })
        .optional(),

    treatedAt: z.coerce.date({
        invalid_type_error: "Ce champ doit être une date",
        required_error: "La date est requise"
    })
        .optional(),

    comptabilizedAt: z.coerce.date({
        invalid_type_error: "Ce champ doit être une date",
        required_error: "La date est requise"
    })
        .optional(),

    sentToComptabilityAt: z.coerce.date({
        invalid_type_error: "Ce champ doit être une date",
        required_error: "La date est requise"
    })
        .optional(),

});

export { comptabilityValidation };