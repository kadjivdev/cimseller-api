import { z } from 'zod';

// commande-recu-versement validation schema
const commandeRecuVersementValidation = z.object({

    recuId: z.coerce.number("Ce champ doit être un entier").int("Ce champ doit être un entier"),

    compteId: z.coerce.number({
        required_error: "Ce champ réquis",
        invalid_type_error: "Ce champ doit être un entier",
    }).int("Ce champ doit être un entier"),

    typeDetailRecuId: z.coerce.number({
        required_error: "Ce champ réquis",
        invalid_type_error: "Ce champ doit être un entier",
    }).int("Ce champ doit être un entier"),

    code: z
        .string("Ce champ doit être un string")
        .nullish(),

    reference: z
        .string("Ce champ doit être un string")
        .nullish(),

    date: z.coerce.date({
        invalid_type_error: "Ce champ doit être une date",
        required_error: "La date est requise",
    }),

    montant: z.coerce.number({
        required_error: "Le montant est réquis",
        invalid_type_error: "Ce champ doit être de format numérique",
    }),

    preuve: z
        .string("La preuve doit être une chaîne")
        .nullish(),
});

export { commandeRecuVersementValidation };