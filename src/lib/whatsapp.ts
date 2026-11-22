/** Only call with an already-authorized phone; never publish hidden seller contact data. */
export function whatsappLink(phone: string | null, title: string, propertyUrl: string): string | null {
  if (!phone || !phone.trim().startsWith("+")) return null;
  const digits = phone.replace(/\D/g, "");
  if (digits.length < 8 || digits.length > 15) return null;
  return `https://wa.me/${digits}?text=${encodeURIComponent(`Hello, I'm interested in ${title}. Could we arrange a viewing? ${propertyUrl}`)}`;
}