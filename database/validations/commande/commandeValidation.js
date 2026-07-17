import { z } from 'zod';

// commandes validation schema
const commandeValidation = z.object({
    code: z
        .string("Ce champ doit être un string")
        .optional(),

    reference: z
        .string("Ce champ est un string")
        .optional(),

    date: z.coerce.date({
        invalid_type_error: "Ce champ doit être une date",
        required_error: "La date est requise"
    }),

    fournisseurId: z
        .int("Ce champ doit être un entier"),
    // .nonempty("Le fournisseur de la commande est réquis"),

    statutId: z
        .int("Ce champ doit être un entier")
        .optional(),
    // .nonempty("Le statut de commande est réquis"),

    typeId: z
        .int("Ce champ doit être un entier")
        .optional(),
});

// commande detail validation
const commandeDetailValidation = z.object({

    productId: z
        .int("Ce champ doit être un entier"),

    qteCommande: z
        .number("Ce champ doit être de format numérique")
        .positive("La quantité doit être supérieure à 0"),

    unitePrice: z
        .number("Ce champ doit être de format numérique")
        .positive("Le prix doit être supérieur à 0"),

    remise: z
        .number("Ce champ doit être de format numérique")
        .optional()
})

export { commandeValidation, commandeDetailValidation };