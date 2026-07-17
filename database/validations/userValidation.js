import { z } from 'zod';

// user validation schema
const userValidation = z.object({
    fullname: z
        .string({ error: "Le nom complet doit être une chaîne" })
        .nonempty("Le nom complet est requis"),

    email: z
        .string({ error: "L'email doit être une chaîne" })
        .nonempty("L'email est requis")
        .email("Adresse email invalide"),

    password: z
        .string({ error: "Le mot de passe doit être une chaîne" })
        .nonempty("Le mot de passe est requis")
        .min(6, "Le mot de passe doit faire au moins 6 caractères"),

    roleId: z
        .number({ error: "Le rôle doit être un nombre" })
        .optional(),
})

export { userValidation };