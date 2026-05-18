import { z } from 'zod';

// permission validation schema
const permissionValidation = z.object({
    name: z
        .string("Le nom complet doit être une chaîne")
        .nonempty("Le nom complet est requis"),

    description: z
        .string("La description doit être une chaîne")
        .optional(),
});

export { permissionValidation };