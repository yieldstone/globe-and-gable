import { createServerFn } from "@tanstack/react-start";
import { z } from "zod";
import { requireSupabaseAuth } from "@/integrations/supabase/auth-middleware";

const UUID = z.string().uuid();

async function phoneFor(propertyId: string): Promise<string | null> {
  const { supabaseAdmin } = await import("@/integrations/supabase/client.server");
  const { data } = await supabaseAdmin.from("properties").select("seller_phone").eq("id", propertyId).maybeSingle();
  return data?.seller_phone ?? null;
}

// Signed-in visitors may see the seller's phone number.
export const getSellerPhone = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((input: { propertyId: string }) => ({ propertyId: UUID.parse(input?.propertyId) }))
  .handler(async ({ data }) => ({ phone: await phoneFor(data.propertyId) }));

export const inquirySchema = z.object({
  propertyId: UUID,
  fullName: z.string().trim().min(1, "Please enter your name").max(100),
  email: z.string().trim().email("Please enter a valid email").max(255),
  phone: z.string().trim().max(40).optional().or(z.literal("")),
  preferredDate: z.string().regex(/^\d{4}-\d{2}-\d{2}$/).optional().or(z.literal("")),
  message: z.string().trim().min(1, "Please write a message").max(2000),
});

export interface MyInquiry {
  id: string;
  createdAt: string;
  fullName: string;
  email: string;
  phone: string | null;
  preferredDate: string | null;
  message: string;
  propertyId: string;
  propertyTitle: string;
  propertyCity: string;
  propertyCountry: string;
}

// Signed-in owners read the inquiries sent on their own listings (RLS enforces ownership).
export const getMyInquiries = createServerFn({ method: "GET" })
  .middleware([requireSupabaseAuth])
  .handler(async ({ context }): Promise<MyInquiry[]> => {
    const { data, error } = await context.supabase
      .from("inquiries")
      .select("id, created_at, full_name, email, phone, preferred_date, message, property_id, properties!inner(title, city, country)")
      .order("created_at", { ascending: false });
    if (error) {
      console.error("my inquiries fetch failed", error);
      throw new Error("Could not load your inquiries. Please try again.");
    }
    return (data ?? []).map((row) => {
      const prop = row.properties as unknown as { title: string; city: string; country: string };
      return {
        id: row.id,
        createdAt: row.created_at,
        fullName: row.full_name,
        email: row.email,
        phone: row.phone,
        preferredDate: row.preferred_date,
        message: row.message,
        propertyId: row.property_id,
        propertyTitle: prop.title,
        propertyCity: prop.city,
        propertyCountry: prop.country,
      };
    });
  });

// Public: anyone can send an inquiry; afterwards they get the seller's phone number.
export const submitInquiry = createServerFn({ method: "POST" })
  .inputValidator((input: z.input<typeof inquirySchema>) => inquirySchema.parse(input))
  .handler(async ({ data }) => {
    const { supabaseAdmin } = await import("@/integrations/supabase/client.server");
    const { error } = await supabaseAdmin.from("inquiries").insert({
      property_id: data.propertyId,
      full_name: data.fullName,
      email: data.email,
      phone: data.phone || null,
      preferred_date: data.preferredDate || null,
      message: data.message,
    });
    if (error) {
      console.error("inquiry insert failed", error);
      throw new Error("Could not send your inquiry. Please try again.");
    }
    return { phone: await phoneFor(data.propertyId) };
  });
