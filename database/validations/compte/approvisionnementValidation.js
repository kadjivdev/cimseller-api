import { z } from 'zod';

// approvisionnement validation schema
const approvisionnementValidation = z.object({

    clientId: z.coerce.number("Ce champ doit être un entier")
        .int("Ce champ doit être un entier"),

    compteBancaireId: z.coerce.number("Ce champ doit être un entier")
        .int("Ce champ doit être un entier"),

    typeDetailRecuId: z.coerce.number("Ce champ doit être un entier")
        .int("Ce champ doit être un entier"),


    code: z
        .string("Ce champ doit être un string")
        .nullish(),
    reference: z
        .string("Ce champ doit être un string")
        .nullish(),


    montant: z.coerce.number({
        required_error: "Le montant est réquis",
        invalid_type_error: "Ce champ doit être de format numérique",
    }),

    date: z.coerce.date({
        invalid_type_error: "Ce champ doit être une date",
        required_error: "La date est requise"
    }),

    preuve: z
        .string("La preuve doit être une chaîne")
        .nullish(),

    comment: z.string({
        required_error: "Le commentaire est requis",
        invalid_type_error: "Le commentaire doit être une chaîne de caractères",
    })
    .nullish(),

    validationComment: z.string({
        required_error: "Le commentaire est requis",
        invalid_type_error: "Le commentaire doit être une chaîne de caractères",
    })
    .nullish(),
});

export { approvisionnementValidation };
