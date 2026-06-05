import { z } from 'zod';

const clientValidation = z.object({
    zoneId: z
        .int({
            required_error: "Ce champ est réquis",
            invalid_type_error: "Ce champ doit être un entier"
        })
        .nullish(),

    statutId: z
        .int({
            required_error: "Ce champ est réquis",
            invalid_type_error: "Ce champ doit être un entier"
        })
        .nullish(),

    typeId: z
        .int({
            required_error: "Ce champ est réquis",
            invalid_type_error: "Ce champ doit être un entier"
        })
        .nullish(),

    raison_sociale: z
        .string("La raison sociale doit être une chaîne")
        .nonempty("La raison sociale est requise"),

    profil: z
        .string("Le profil doit être de type string")
        .optional(),

    phone: z
        .string("Le phone doit être de type string")
        .optional(),

    email: z
        .string("Le mail doit être de type string")
        .optional(),

    adresse: z
        .string("L'adresse doit être de type string")
        .optional(),

});

export { clientValidation };
