import { z } from 'zod';

// role validation schema
const roleValidation = z.object({
    name: z
        .string("Le nom complet doit être une chaîne")
        .nonempty("Le nom complet est requis"),

    description: z
        .string("La description doit être une chaîne")
        .optional(),

    permissionIds: z.array(z.number(), {
        invalid_type_error: "Les permissions doivent être un tableau de nombres"
    }).optional(),
});

export { roleValidation };