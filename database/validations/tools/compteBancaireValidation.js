import { z } from 'zod';

const compteBancaireValidation = z.object({
    intitule: z
        .string("L'intitule doit être une chaîne")
        .nonempty("L'intitule est requis"),

    numero: z
        .string("Le numéro doit être une chaîne")
        .nonempty("Le numéro est requis"),

    banqueId: z
        .number({
            invalid_type_error: "Ce champ doit être un entier"
        })
        .int("Ce champ doit être un entier")
        .nullish(),

});

export { compteBancaireValidation };
