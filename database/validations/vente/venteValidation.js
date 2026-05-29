import { z } from 'zod';

// ventes validation schema
const venteValidation = z.object({
    code: z
        .string("Ce champ doit être un entier")
        .optional(),

    commandClientId: z
        .int({
            required_error: "Ce champ est réquis",
            invalid_type_error: "Ce champ doit être un entier"
        })
        .optional(),

    statutId: z
        .int({
            required_error: "Ce champ est réquis",
            invalid_type_error: "Ce champ doit être un entier"
        }),

    produitId: z
        .int({
            required_error: "Ce champ est réquis",
            invalid_type_error: "Ce champ doit être un entier"
        })
        .optional(),

    typeId: z
        .int({
            required_error: "Ce champ est réquis",
            invalid_type_error: "Ce champ doit être un entier"
        })
        .optional(),

    clientId: z
        .int({
            required_error: "Ce champ est réquis",
            invalid_type_error: "Ce champ doit être un entier"
        })
        .optional(),

    date: z.coerce.date({
        invalid_type_error: "Ce champ doit être une date",
        required_error: "La date est requise"
    }),

    montant: z
        .number({
            required_error: "Ce champ est réquis",
            invalid_type_error: "Ce champ doit être de format numérique"
        })
        .optional(),

    unitePrice: z
        .number({
            required_error: "Ce champ est réquis",
            invalid_type_error: "Ce champ doit être de format numérique"
        }).optional(),

    qteTotal: z
        .number({
            required_error: "Ce champ est réquis",
            invalid_type_error: "Ce champ doit être de format numérique"
        }).optional(),

    remise: z
        .number({
            required_error: "Ce champ est réquis",
            invalid_type_error: "Ce champ doit être de format numérique"
        }).optional(),

    transport: z
        .number({
            required_error: "Ce champ est réquis",
            invalid_type_error: "Ce champ doit être de format numérique"
        }).optional(),

    destination: z
        .number({
            required_error: "Ce champ est réquis",
            invalid_type_error: "Ce champ doit être de format numérique"
        }).optional(),

    preuve: z
        .string({
            required_error: "Ce champ est réquis",
            invalid_type_error: "Ce champ doit être de format numérique"
        }).optional(),

    reglemented: z
        .boolean({
            required_error: "Ce champ est réquis",
            invalid_type_error: "Ce champ doit être de format numérique"
        }).optional(),

    observation: z
        .string("Ce champ doit être de format string")
        .optional(),
});

export { venteValidation };