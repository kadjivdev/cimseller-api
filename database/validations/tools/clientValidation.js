import { z } from 'zod';
const numberField = (label = "Ce champ") =>
    z.coerce.number({
        error: (issue) =>
            issue.input === undefined || issue.input === ""
                ? `${label} est réquis`
                : `${label} doit être de format numérique`,
    });

const clientValidation = z.object({
    zoneId: z.coerce.number({ error: "Ce champ doit être un nombre" })
        .int({ error: "Ce champ doit être un entier" })
        .nullish(),

    statutId: z.coerce.number({ error: "Ce champ doit être un nombre" })
        .int({ error: "Ce champ doit être un entier" })
        .nullish(),

    typeId: z.coerce.number({ error: "Ce champ doit être un nombre" })
        .int({ error: "Ce champ doit être un entier" })
        .nullish(),

    raison_sociale: z
        .string({ error: "La raison sociale doit être une chaîne" })
        .nonempty("La raison sociale est requise"),

    profil: z
        .string({ error: "Le profil doit être de type string" })
        .optional(),

    phone: z
        .string({ error: "Le téléphone doit être de type string" })
        .optional(),

    email: z
        .string({ error: "L'email doit être de type string" })
        .nullish(),

    adresse: z
        .string({ error: "L'adresse doit être de type string" })
        .nullish(),

    seuil: numberField("Le seuil").optional()  // ✅ on appelle la factory, puis .optional() sur le schema résultant
});

export { clientValidation };