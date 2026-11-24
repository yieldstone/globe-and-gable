import { getAgency, type Property } from "./properties";

/** Only call with an already-authorized phone; never publish hidden seller contact data. */
export function whatsappLink(phone: string | null | undefined, title: string, propertyUrl: string, priceText?: string): string | null {
  if (!phone || !phone.trim().startsWith("+")) return null;
  const digits = phone.replace(/\D/g, "");
  if (digits.length < 8 || digits.length > 15) return null;
  const pricePart = priceText ? ` (${priceText})` : "";
  return `https://wa.me/${digits}?text=${encodeURIComponent(`Hello, I'm interested in ${title}${pricePart}. Could we arrange a viewing? ${propertyUrl}`)}`;
}

/** Agency listings use the agency's public business number; private sellers need a revealed phone. */
export function listingWhatsappLink(p: Property, priceText: string, propertyUrl: string, revealedPhone?: string | null): string | null {
  const agencyPhone = p.agencyId ? getAgency(p.agencyId)?.phone : undefined;
  return whatsappLink(agencyPhone ?? revealedPhone, p.title, propertyUrl, priceText);
}
