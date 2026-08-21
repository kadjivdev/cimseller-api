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
        .number({ error: "Le rôle est requis et doit être un nombre" })
        .int("Le rôle doit être un entier")
        .positive("Le rôle doit être un identifiant valide"),

    zoneId: z
        .number({ error: "La zone est requise et doit être un nombre" })
        .int("La zone doit être un entier")
        .positive("La zone doit être un identifiant valide"),
})

export { userValidation };