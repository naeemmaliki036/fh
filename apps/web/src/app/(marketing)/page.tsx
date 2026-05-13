import type { Metadata } from "next";
import { AuthRedirectGate } from "@/components/marketing/AuthRedirectGate";
import { HeroSection } from "@/components/marketing/HeroSection";
import { ValuePropsSection } from "@/components/marketing/ValuePropsSection";
import { FeaturesSection } from "@/components/marketing/FeaturesSection";
import { WorkflowSection } from "@/components/marketing/WorkflowSection";
import { PublicSiteShowcaseSection } from "@/components/marketing/PublicSiteShowcaseSection";
import { PricingTeaserSection } from "@/components/marketing/PricingTeaserSection";
import { FaqSection } from "@/components/marketing/FaqSection";
import { FinalCtaSection } from "@/components/marketing/FinalCtaSection";

export const metadata: Metadata = {
  title: "AqarFlow — Real Estate Operations Platform",
  description:
    "AqarFlow gives real-estate companies in UAE and KSA a complete operations platform — properties, listings, leads, deals, commissions, and a public site for every tenant.",
};

export default function MarketingPage(): React.ReactElement {
  return (
    <div className="bg-[#faf9f6]">
      <AuthRedirectGate />
      <HeroSection />
      <ValuePropsSection />
      <FeaturesSection />
      <WorkflowSection />
      <PublicSiteShowcaseSection />
      <PricingTeaserSection />
      <FaqSection />
      <FinalCtaSection />
    </div>
  );
}
