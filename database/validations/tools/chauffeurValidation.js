import { z } from 'zod';

const chauffeurValidation = z.object({
    fullname: z
        .string("Le nom doit être une chaîne")
        .nonempty("Le nom est requis"),

    permis: z
        .string("Le permis doit être de type string")
        .optional(),

    phone: z
        .string("Le permis doit être de type string")
        .optional(),

});

export { chauffeurValidation };
