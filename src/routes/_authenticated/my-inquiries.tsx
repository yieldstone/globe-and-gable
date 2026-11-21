import { createFileRoute, Link } from "@tanstack/react-router";
import { useServerFn } from "@tanstack/react-start";
import { useQuery } from "@tanstack/react-query";
import { CalendarDays, Inbox, Mail, Phone } from "lucide-react";
import { getMyInquiries, type MyInquiry } from "@/lib/inquiries.functions";

export const Route = createFileRoute("/_authenticated/my-inquiries")({
  head: () => ({
    meta: [
      { title: "My Inquiries — Atlas Estates" },
      { name: "description", content: "Viewing requests and messages sent on your Atlas Estates listings." },
      { property: "og:title", content: "My Inquiries — Atlas Estates" },
      { property: "og:description", content: "Viewing requests and messages sent on your Atlas Estates listings." },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary" },
      { name: "robots", content: "noindex" },
    ],
  }),
  component: MyInquiriesPage,
});

function formatDate(iso: string) {
  return new Date(iso).toLocaleDateString("en-US", { year: "numeric", month: "short", day: "numeric" });
}

function InquiryCard({ inquiry }: { inquiry: MyInquiry }) {
  return (
    <article className="rounded-xl border border-border bg-card p-5 shadow-sm">
      <div className="flex flex-wrap items-start justify-between gap-2">
        <div>
          <h2 className="font-display text-lg font-semibold text-foreground">{inquiry.fullName}</h2>
          <Link
            to="/properties/$propertyId"
            params={{ propertyId: inquiry.propertyId }}
            className="text-sm font-medium text-primary hover:underline"
          >
            {inquiry.propertyTitle} · {inquiry.propertyCity}, {inquiry.propertyCountry}
          </Link>
        </div>
        <time className="text-xs text-muted-foreground">{formatDate(inquiry.createdAt)}</time>
      </div>
      <div className="mt-3 flex flex-wrap gap-x-5 gap-y-1 text-sm text-muted-foreground">
        <a href={`mailto:${inquiry.email}`} className="inline-flex items-center gap-1.5 hover:text-foreground">
          <Mail className="size-3.5" /> {inquiry.email}
        </a>
        {inquiry.phone && (
          <a href={`tel:${inquiry.phone}`} className="inline-flex items-center gap-1.5 hover:text-foreground">
            <Phone className="size-3.5" /> {inquiry.phone}
          </a>
        )}
        {inquiry.preferredDate && (
          <span className="inline-flex items-center gap-1.5">
            <CalendarDays className="size-3.5" /> Preferred: {formatDate(inquiry.preferredDate)}
          </span>
        )}
      </div>
      <p className="mt-3 whitespace-pre-line text-sm leading-relaxed text-foreground/90">{inquiry.message}</p>
    </article>
  );
}

function MyInquiriesPage() {
  const fetchInquiries = useServerFn(getMyInquiries);
  const { data: inquiries, isPending, isError, refetch } = useQuery({
    queryKey: ["my-inquiries"],
    queryFn: () => fetchInquiries(),
  });

  return (
    <div className="mx-auto max-w-4xl px-4 py-10 sm:px-6">
      <h1 className="font-display text-3xl font-semibold tracking-tight text-foreground">My Inquiries</h1>
      <p className="mt-2 text-sm text-muted-foreground">
        Viewing requests and messages people sent on your listings.
      </p>

      {isPending && <p className="mt-10 text-sm text-muted-foreground">Loading your inquiries…</p>}

      {isError && (
        <div className="mt-10 rounded-xl border border-border bg-card p-6 text-center">
          <p className="text-sm text-muted-foreground">Could not load your inquiries.</p>
          <button
            onClick={() => refetch()}
            className="mt-3 inline-flex items-center justify-center rounded-md bg-primary px-4 py-2 text-sm font-medium text-primary-foreground hover:bg-primary/90"
          >
            Try again
          </button>
        </div>
      )}

      {inquiries && inquiries.length === 0 && (
        <div className="mt-10 flex flex-col items-center rounded-xl border border-dashed border-border bg-card/50 px-6 py-14 text-center">
          <Inbox className="size-10 text-muted-foreground" />
          <h2 className="mt-4 font-display text-xl font-semibold text-foreground">No inquiries yet</h2>
          <p className="mt-2 max-w-sm text-sm text-muted-foreground">
            When someone asks about one of your listings, their message will show up here.
          </p>
          <Link
            to="/post-listing"
            className="mt-5 inline-flex items-center justify-center rounded-md bg-primary px-4 py-2 text-sm font-medium text-primary-foreground hover:bg-primary/90"
          >
            Post a listing
          </Link>
        </div>
      )}

      {inquiries && inquiries.length > 0 && (
        <div className="mt-8 space-y-4">
          {inquiries.map((inq) => (
            <InquiryCard key={inq.id} inquiry={inq} />
          ))}
        </div>
      )}
    </div>
  );
}
