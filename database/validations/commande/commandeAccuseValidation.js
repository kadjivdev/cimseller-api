import { z } from 'zod';

// commande-accuse validation schema
const commandeAccuseValidation = z.object({

    commandeId: z.coerce.number("Ce champ doit être un entier").int("Ce champ doit être un entier"),

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
        invalid_type_error: "Ce champ doit être une date",
        required_error: "La date est requise"
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
