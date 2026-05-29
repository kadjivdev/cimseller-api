import { z } from 'zod';

// commande-recus validation schema
const commandeRecuValidation = z.object({

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

    tonnage: z.coerce.number({
        required_error: "Le tonnage est requis",
        invalid_type_error: "Le tonnage doit être un numérique",
    }),

    montant: z.coerce.number({
        required_error: "Le montant est réquis",
        invalid_type_error: "Ce champ doit être de format numérique",
    }),

    preuve: z
        .string("La preuve doit être une chaîne")
        .nullish(),

    qteRecu: z.coerce.number({
        required_error: "La quantité est réquise",
        invalid_type_error: "La quantité reçue doit être un numérique",
    }),

    createdById: z.coerce
        .number("Ce champ doit être un entier")
        .int("Ce champ doit être un entier")
        .nullish(),
});

export { commandeRecuValidation };
