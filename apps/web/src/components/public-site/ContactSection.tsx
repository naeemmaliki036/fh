import type { PublicTenantProfile } from "@/lib/types/public-site";
import { ContactForm } from "./ContactForm";

interface ContactSectionProps {
  slug: string;
  profile: PublicTenantProfile;
}

export function ContactSection({ slug, profile }: ContactSectionProps): React.ReactElement {
  return (
    <section id="contact" className="py-14">
      <div className="mx-auto w-[min(100%-40px,1280px)]">
        <div className="grid gap-10 rounded-[2.5rem] bg-white p-8 shadow-sm md:p-12 lg:grid-cols-[0.9fr_1.1fr]">
          <div>
            <span className="text-sm font-black uppercase tracking-[0.16em] text-amber-700">
              Get started
            </span>
            <h2 className="mt-3 max-w-3xl text-4xl font-black tracking-tight text-slate-950 md:text-5xl">
              Ready to buy, rent, sell, or list?
            </h2>
            <p className="mt-5 text-sm leading-6 text-slate-500">
              Tell us what you are looking for and {profile.name} will connect you with the right agent and property options.
            </p>
          </div>
          <ContactForm slug={slug} />
        </div>
      </div>
    </section>
  );
}
