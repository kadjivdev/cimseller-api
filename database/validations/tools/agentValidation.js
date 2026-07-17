import { z } from 'zod';

const agentValidation = z.object({
    nom: z
        .string("Le nom doit être une chaîne")
        .nonempty("Le nom est requis"),

    prenom: z
        .string("Le prénom doit être une chaîne")
        .nonempty("Le prénom est requis"),

    phone: z
        .string("Le téléphone doit être une chaîne")
        .nonempty("Le téléphone est requis"),

});

export { agentValidation };
