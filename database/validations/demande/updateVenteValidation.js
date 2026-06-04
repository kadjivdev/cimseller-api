import { z } from 'zod';

// update validation schema
const updateVenteValidation = z.object({

    venteId: z.coerce.number("Ce champ doit être un entier")
        .int("Ce champ doit être un entier"),

    clientId: z.coerce.number("Ce champ doit être un entier")
        .int("Ce champ doit être un entier"),

    code: z
        .string("Ce champ doit être un string")
        .nullish(),
    raison: z
        .string("Ce champ doit être un string")
        .nullish(),

    date: z.coerce.date({
        invalid_type_error: "Ce champ doit être une date",
        required_error: "La date est requise"
    }),

    preuve: z
        .string("La preuve doit être une chaîne")
        .nullish(),

    modified: z
        .boolean({
            required_error: "Le champ modified est requis",
            invalid_type_error: "Le champ modified doit être un booléen",
        })
        .nullish(),

});

export { updateVenteValidation };
