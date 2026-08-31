import { z } from 'zod';

// champs number
const numberField = (label = "Ce champ") =>
    z.coerce.number({
        error: (issue) =>
            issue.input === undefined || issue.input === ""
                ? `${label} est réquis`
                : `${label} doit être de format numérique`,
    });

// ventes validation schema
const comptabilityValidation = z.object({
    venteId: z
        .int({
            required_error: "Ce champ est réquis",
            invalid_type_error: "Ce champ doit être de format numérique"
        }).optional(),

    unitPriceAib: numberField()
        .optional(),
    unitPriceTva: numberField()
        .optional(),
    unitPriceMarge: numberField()
        .optional(),
    unitPriceTtc: numberField()
        .optional(),

    priceHT: numberField()
        .optional(),
    priceAib: numberField()
        .optional(),
    priceTva: numberField()
        .optional(),
    priceMarge: numberField()
        .optional(),

    price118: numberField()
        .optional(),
        
    priceTtc: numberField()
        .optional(),

    senderToComptability: z
        .int({
            required_error: "Ce champ est réquis",
            invalid_type_error: "Ce champ doit être un entier"
        })
        .optional(),

    treatedAt: z.coerce.date({
        invalid_type_error: "Ce champ doit être une date",
        required_error: "La date est requise"
    })
        .optional(),

    comptabilizedAt: z.coerce.date({
        invalid_type_error: "Ce champ doit être une date",
        required_error: "La date est requise"
    })
        .optional(),

    sentToComptabilityAt: z.coerce.date({
        invalid_type_error: "Ce champ doit être une date",
        required_error: "La date est requise"
    })
        .optional(),


    // les totaux
    usinePrixHT: numberField()
        .optional(),
    margePrice: numberField()
        .optional(),
    htPrice: numberField()
        .optional(),
    bruitPrice: numberField()
        .optional(),
    netHorsTaxe: numberField()
        .optional(),
    tvaPrice: numberField()
        .optional(),
    aibPrice: numberField()
        .optional(),
    prixTTC: numberField()
        .optional(),
});

export { comptabilityValidation };