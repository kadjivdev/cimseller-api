import { z } from 'zod';

const intField = (label = "Ce champ") =>
    z.int({
        error: (issue) =>
            issue.input === undefined
                ? `${label} est réquis`
                : `${label} doit être un entier`,
    });

// pour les champs numériques venant de <input type="number"> (string côté form)
const numberField = (label = "Ce champ") =>
    z.coerce.number({
        error: (issue) =>
            issue.input === undefined || issue.input === ""
                ? `${label} est réquis`
                : `${label} doit être de format numérique`,
    });

const stringField = (label = "Ce champ") =>
    z.string({
        error: (issue) =>
            issue.input === undefined
                ? `${label} est réquis`
                : `${label} doit être de format string`,
    });

// ventes validation schema
const venteValidation = z.object({
    code: z.string("Ce champ doit être une chaîne").optional(),

    commandClientId: intField().optional(),

    statutId: intField().optional(), // requis, pas de .optional()

    produitId: intField().optional(),
    programmationId: intField().optional(),

    typeId: intField().optional(),

    typeFactureVenteId: intField().optional(),

    clientCommanderId: intField().optional(), // le client qui a passé la commande
    clientId: intField().optional(), // le client payeur

    date: z.coerce
        .date({
            error: (issue) =>
                issue.input === undefined
                    ? "La date est requise"
                    : "Ce champ doit être une date",
        })
        .refine((date) => date <= new Date(), {
            message: "La date doit être antérieure ou égale à aujourd'hui",
        }),

    montant: numberField().optional(),

    unitePrice: numberField("Le prix unitaire").optional(),

    qteTotal: numberField("La quantité totale").optional(),

    remise: numberField("La remise").optional(),

    transport: numberField("Le transport").optional(),

    destination: stringField("La destination").optional(),

    preuve: stringField("La preuve").optional(),

    reglemented: z
        .boolean({
            error: (issue) =>
                issue.input === undefined
                    ? "Ce champ est réquis"
                    : "Ce champ doit être un booléen",
        })
        .optional(),

    observation: z.string("Ce champ doit être de format string").optional(),
});

export { venteValidation };