"use client";

import React, { useState } from "react";
import { ChevronDown } from "lucide-react";
import { cn } from "@/lib/utils/cn";

interface FaqItem {
  question: string;
  answer: string;
}

const FAQ_ITEMS: FaqItem[] = [
  {
    question: "What is AqarFlow?",
    answer:
      "AqarFlow is a multi-tenant SaaS platform purpose-built for real-estate companies in the UAE and KSA. It covers the full operations lifecycle — properties, listings, leads, deals, commissions, document collection, audit trails, and a public-facing site for each tenant.",
  },
  {
    question: "Who is AqarFlow for?",
    answer:
      "AqarFlow is designed for real-estate brokerages, agencies, and property management companies that need a structured, scalable system. Whether you have 2 agents or 200, the platform grows with you.",
  },
  {
    question: "Can I use it for my agency in Dubai or Riyadh?",
    answer:
      "Yes. AqarFlow is built with the UAE and KSA market in mind — AED/SAR pricing, local property types, Arabic-sensitive design, and compliance features aligned with RERA and regional requirements.",
  },
  {
    question: "Do you support multi-branch operations?",
    answer:
      "Absolutely. The platform is multi-tenant from the ground up. Each branch or brand can operate as a separate tenant with isolated data, its own team, and its own public site — all managed from a single super-admin dashboard.",
  },
  {
    question: "Is my data secure?",
    answer:
      "Yes. Public media (property images) is served via Cloudflare CDN. Private documents (passports, KYC, contracts) are stored in AWS S3 with signed URLs only — raw S3 URLs are never exposed. Every access is logged in the audit trail.",
  },
  {
    question: "How are portal integrations handled?",
    answer:
      "AqarFlow uses a connector-based architecture. Each portal (Bayut, Property Finder, Dubizzle) has a dedicated mapper that transforms your internal listings into the portal's required format, validates them before submission, and tracks sync status with retry support. Portal integrations are on the roadmap for Phase 2.",
  },
  {
    question: "How does pricing work?",
    answer:
      "Pricing details are coming soon. We're designing a transparent, usage-based model with no per-feature gatekeeping. Join the early-access waitlist above to get founding-member rates.",
  },
];

interface AccordionItemProps {
  item: FaqItem;
  isOpen: boolean;
  onToggle: () => void;
}

function AccordionItem({ item, isOpen, onToggle }: AccordionItemProps): React.ReactElement {
  return (
    <div className="border-b border-black/8 last:border-0">
      <button
        onClick={onToggle}
        className="w-full flex items-center justify-between py-5 text-left gap-4 group"
        aria-expanded={isOpen}
      >
        <span className="text-base font-semibold text-[#0a0a0a] group-hover:text-[#0f766e] transition-colors">
          {item.question}
        </span>
        <ChevronDown
          className={cn(
            "w-5 h-5 text-[#0f766e] shrink-0 transition-transform duration-200",
            isOpen && "rotate-180",
          )}
        />
      </button>
      <div
        className={cn(
          "overflow-hidden transition-all duration-200",
          isOpen ? "max-h-96 pb-5" : "max-h-0",
        )}
      >
        <p className="text-[#4a4a4a] text-sm leading-relaxed">{item.answer}</p>
      </div>
    </div>
  );
}

export function FaqSection(): React.ReactElement {
  const [openIndex, setOpenIndex] = useState<number | null>(0);

  function toggle(index: number): void {
    setOpenIndex((prev) => (prev === index ? null : index));
  }

  return (
    <section id="faq" className="bg-[#faf9f6] py-24">
      <div className="max-w-3xl mx-auto px-4 sm:px-6">
        <div className="text-center mb-14">
          <p className="text-xs font-semibold text-[#0f766e] uppercase tracking-widest mb-3">
            FAQ
          </p>
          <h2 className="text-4xl font-extrabold text-[#0a0a0a] tracking-tight">
            Common questions
          </h2>
        </div>
        <div className="bg-white rounded-2xl border border-black/8 shadow-sm px-6 sm:px-8">
          {FAQ_ITEMS.map((item, index) => (
            <AccordionItem
              key={item.question}
              item={item}
              isOpen={openIndex === index}
              onToggle={() => toggle(index)}
            />
          ))}
        </div>
      </div>
    </section>
  );
}
