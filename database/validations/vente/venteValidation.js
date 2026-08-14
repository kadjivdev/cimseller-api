import { z } from 'zod';

const intField = (label = "Ce champ") =>
    z.coerce.number({
        error: (issue) =>
            issue.input === undefined || issue.input === ""
                ? `${label} est réquis`
                : `${label} doit être un entier`,
    }).int(`${label} doit être un entier`);

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

const booleanField = (label = "Ce champ") =>
    z.preprocess(
        (val) => {
            if (val === 'true' || val === true) return true
            if (val === 'false' || val === false) return false
            if (val === '' || val === null || val === undefined) return undefined
            return val
        },
        z.boolean({
            error: (issue) =>
                issue.input === undefined
                    ? `${label} est réquis`
                    : `${label} doit être un booléen`,
        })
    );

// ventes validation schema
const venteValidation = z.object({
    code: z.string("Ce champ doit être une chaîne").optional(),

    commandClientId: intField().optional(),
    // statutId: intField(), // requis
    produitId: intField().optional(),
    programmationId: intField().optional(),
    typeId: intField().optional(),
    typeFactureVenteId: intField().optional(),
    clientCommanderId: intField().optional(),
    clientId: intField().optional(),

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

    reglemented: booleanField().optional(),

    observation: z.string("Ce champ doit être de format string").optional(),
});

export { venteValidation };