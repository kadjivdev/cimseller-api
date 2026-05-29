import { z } from 'zod';

// commandes client validation schema
const commandeClientValidation = z.object({
    code: z
        .string("Ce champ doit être un entier")
        .optional(),

    statutId: z
        .int({
            required_error: "Ce champ est réquis",
            invalid_type_error: "Ce champ doit être un entier"
        }),

    typeCommandeClientId: z
        .int({
            required_error: "Ce champ est réquis",
            invalid_type_error: "Ce champ doit être un entier"
        }),

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
        }),
});

export { commandeClientValidation };