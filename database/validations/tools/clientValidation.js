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

    nom: z
        .string("Le nom doit être une chaîne")
        .nonempty("Le nom est requis"),

    prenom: z
        .string("Le prénom doit être une chaîne")
        .nonempty("Le prénom est requis"),

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
