/** Who runs this Vult deployment, set at build time (VITE_LEGAL_ENTITY, VITE_CONTACT_EMAIL). */
export const CONTACT_EMAIL = (import.meta.env.VITE_CONTACT_EMAIL as string | undefined) || "hello@vult.app";
export const LEGAL_ENTITY = (import.meta.env.VITE_LEGAL_ENTITY as string | undefined) || "[company name, address, VAT number]";
