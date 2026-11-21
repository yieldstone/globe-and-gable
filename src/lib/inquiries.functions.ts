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
