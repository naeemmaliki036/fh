import type { ResolvedSiteConfig } from "@/lib/types/public-site";

export const PUBLIC_SITE_DEFAULTS: ResolvedSiteConfig = {
  hero: {
    headline: null,
    subheadline: "Curated listings and a smooth process, end to end.",
    eyebrow: null,
    image_url: null,
  },
  theme: {
    primary_color: "#020617",
    accent_color: "#b45309",
  },
  services: {
    enabled: true,
    title: "What we offer",
    subtitle: "Everything for modern real estate deals.",
    cards: [
      { title: "Buy Property", description: "Explore verified villas, apartments, townhouses, and investment-ready homes across prime UAE communities." },
      { title: "Rent Homes", description: "Find ready-to-move rental homes with clear pricing, location filters, and direct agent support." },
      { title: "Sell & List", description: "List your property with professional photography, valuation support, and smart lead management." },
      { title: "Verified Process", description: "Secure document collection, buyer verification, and transparent deal tracking from enquiry to closing." },
    ],
  },
  team: {
    title: "Meet the team",
    subtitle: "Expert team members ready to guide you from enquiry to keys.",
    members: [],
    show_agents: true,
  },
  footer: {
    description: "A modern real estate platform for verified listings, lead management, customer document collection, and secure deal workflows.",
    address: null,
    instagram_url: null,
    facebook_url: null,
    linkedin_url: null,
  },
  sections: {
    services_enabled: true,
    team_enabled: true,
    contact_enabled: true,
  },
  contact: {
    title: "Get started",
    headline: "Ready to buy, rent, sell, or list?",
    whatsapp: null,
  },
};
