import { z } from 'zod';

// commandes validation schema
const commandeValidation = z.object({
    code: z
        .string("Ce champ doit être un entier")
        .optional(),

    date: z.coerce.date({
        invalid_type_error: "Ce champ doit être une date",
        required_error: "La date est requise"
    }),

    fournisseurId: z
        .int("Ce champ doit être un entier"),
    // .nonempty("Le fournisseur de la commande est réquis"),

    montant: z
        .number("Ce champ doit être de format numérique")
        .optional(),
    // .nonempty("Le montant est requis"),

    statutId: z
        .int("Ce champ doit être un entier")
        .optional(),
    // .nonempty("Le statut de commande est réquis"),

    typeId: z
        .int("Ce champ doit être un entier"),
    // .nonempty("Le type de commande est réquis"),
});

// commande detail validation
const commandeDetailValidation = z.object({
    commandeId: z
        .int("Ce champ doit être un entier")
        .optional(),
    // .nonempty("La commande est réquise"),

    productId: z
        .int("Ce champ doit être un entier")
        .optional(),
    // .nonempty("Le produit est réquis"),

    qteCommande: z
        .number("Ce champ doit être de format numérique")
        .optional(),
    // .nonempty("Le produit est réquis"),

    unitePrice: z
        .number("Ce champ doit être de format numérique")
        .optional(),
    // .nonempty("Le prix est réquis"),

    remise: z
        .number("Ce champ doit être de format numérique")
        .optional()
})

export { commandeValidation, commandeDetailValidation };