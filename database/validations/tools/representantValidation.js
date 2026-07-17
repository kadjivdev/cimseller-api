import { z } from 'zod';

const representantValidation = z.object({
    nom: z
        .string("Le nom doit être une chaîne")
        .nonempty("Le nom est requis"),

    prenom: z
        .string("Le prénom doit être une chaîne")
        .nonempty("Le prénom est requis"),

    phone: z
        .string("Le téléphone doit être une chaîne")
        .nullish(),

    email: z
        .string("Le téléphone doit être une chaîne")
        .nullish(),
});

export { representantValidation };
