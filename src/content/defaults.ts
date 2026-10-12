import type { SiteContent } from "./schema"
import { defaultLayout } from "./migrate"

export const defaultContent: SiteContent = {
  version: 1,
  seo: {
    title: "C.M.E. Camacho Dental Clinic — Antipolo",
    description:
      "Check-ups, fillings, braces, dentures and more at Sumulong Memorial Circle, San Jose, Antipolo — plus dental supplies for professionals.",
  },
  brand: {
    name: "C.M.E. Camacho Dental Clinic",
    logoNav: "/images/logo-nav.png",
    logoMark: "/images/logo-mark.png",
    logoFooter: "/images/logo-footer.png",
  },
  contact: {
    primaryPhone: "+63 927 771 5208",
    phones: [
      { label: "Globe", number: "+63 927 771 5208" },
      { label: "Smart", number: "+63 928 387 8304" },
    ],
    email: "cmec.dental@gmail.com",
    messengerUrl: "https://m.me/cmecamachoclinic",
    facebookUrl: "https://www.facebook.com/cmecamachoclinic/",
    address: "Blk 1 Lot 12 Sumulong Memorial Circle, Brgy. San Jose, Antipolo, 1870",
    mapEmbedUrl: "https://www.google.com/maps?q=Sumulong+Memorial+Circle,+San+Jose,+Antipolo&output=embed",
    directionsUrl: "https://www.google.com/maps/search/?api=1&query=Sumulong+Memorial+Circle+San+Jose+Antipolo",
  },
  nav: {
    links: [
      { label: "Treatments", href: "#treatments" },
      { label: "Dentists", href: "#dentists" },
      { label: "Schedule", href: "#schedule" },
      { label: "FAQs", href: "#faq" },
      { label: "Visit", href: "#visit" },
    ],
    ctaLabel: "Book a visit",
  },
  hero: {
    badge: "San Jose, Antipolo · Open daily",
    headline: "Good teeth,\nclose to home.",
    subtext:
      "Check-ups, fillings, braces, dentures and more at Sumulong Memorial Circle — plus dental supplies for professionals.",
    primaryCtaLabel: "Request an appointment",
    image: "/images/hero-team.png",
    darkCardText: "Dental clinic, supplies & services",
    mintCardLabel: "Message us",
    mintCardLinkText: "Chat on Messenger",
  },
  sections: {
    treatments: {
      eyebrow: "01 — Treatments",
      title: "What we do",
      intro: "Pick a treatment to see how it works, how long it takes, and who it's for.",
    },
    dentists: {
      eyebrow: "02 — Our dentists",
      title: "The people\nbehind the chair",
      intro: "",
    },
    schedule: {
      eyebrow: "03 — Schedule",
      title: "Who's in,\nand when",
      intro: "Pick a day to see each dentist's open times. Tap a time and we'll fill in your request.",
      note: "Hours may change on holidays. Every request is confirmed by text or call before your visit.",
    },
    faq: {
      eyebrow: "04 — FAQs",
      title: "Questions,\nanswered",
      intro: "Something else? Message us on [Facebook](https://www.facebook.com/cmecamachoclinic/) or call 0927 771 5208.",
    },
    booking: {
      eyebrow: "05 — Appointment request",
      title: "Save your\nseat.",
      intro: "Send your preferred date and time. We'll text or call to confirm your slot — usually within the day.",
      successTitle: "Request received, {firstName}.",
      successText: "We'll contact you at {phone} to confirm.",
      submitLabel: "Send request",
    },
    visit: {
      label: "Find us",
      directionsLabel: "Get directions",
    },
  },
  supplies: {
    eyebrow: "Also: dental supplies",
    text: "We supply materials and instruments to fellow dentists and students. Ask for current stock and pricing.",
    ctaLabel: "Ask about supplies",
    ctaHref: "mailto:cmec.dental@gmail.com?subject=Supplies%20inquiry",
  },
  layout: { sections: defaultLayout() },
  treatments: [
    {
      id: "prophylaxis",
      name: "Oral Prophylaxis (Cleaning)",
      images: ["/images/prophylaxis-2.png", "/images/prophylaxis-1.png"],
      duration: "30–45 min",
      visits: "1 visit",
      placeholderHint: "cleaning / scaling photo",
      description:
        "A full oral exam followed by scaling and polishing to remove plaque and tartar. We check for cavities and gum problems early, when they are simplest to fix.",
      steps: ["Exam and history", "Scaling and polishing", "Home-care advice"],
      goodFor: "Everyone, every 6 months.",
    },
    {
      id: "restoration",
      name: "Tooth Restoration (Pasta)",
      images: ["/images/restoration-2.png", "/images/restoration-3.png", "/images/restoration-1.png"],
      duration: "30–60 min",
      visits: "1 visit",
      placeholderHint: "tooth-coloured filling photo",
      description:
        "Tooth-coloured composite fillings restore teeth damaged by decay or small chips, matched to the shade of your natural teeth.",
      steps: ["Numb the area", "Remove decay", "Bond and shape"],
      goodFor: "Cavities, chips, worn edges.",
    },
    {
      id: "extraction",
      name: "Extraction & Odontectomy",
      images: ["/images/odontectomy-1.png"],
      duration: "30–90 min",
      visits: "1 visit + check",
      placeholderHint: "extraction / aftercare photo",
      description:
        "Gentle removal of teeth that are badly decayed, loose or impacted, including odontectomy (surgical wisdom tooth removal), with clear aftercare instructions to help you heal quickly.",
      steps: ["X-ray and assessment", "Local anaesthesia", "Removal and aftercare"],
      goodFor: "Severe decay, crowding, wisdom teeth.",
    },
    {
      id: "root-canal",
      name: "Root Canal",
      images: [],
      duration: "60–90 min",
      visits: "2–3 visits",
      placeholderHint: "root canal treatment photo",
      description:
        "Saves an infected tooth by cleaning out the inflamed pulp, disinfecting the canals and sealing them, so you keep your natural tooth.",
      steps: ["Open and clean canals", "Disinfect and fill", "Seal and restore"],
      goodFor: "Deep pain, infection, abscess.",
    },
    {
      id: "braces",
      name: "Braces",
      images: ["/images/braces-1.png"],
      duration: "45 min fitting",
      visits: "Monthly adjustments",
      placeholderHint: "braces / smile photo",
      description:
        "Metal or ceramic braces gradually move teeth into alignment for a healthier bite and an even smile. Monthly visits keep treatment on track.",
      steps: ["Consult and records", "Bracket fitting", "Monthly adjustments"],
      goodFor: "Crowding, gaps, bite problems.",
    },
    {
      id: "dentures",
      name: "Dentures (Pustiso)",
      images: ["/images/denture-1.png"],
      duration: "Per fitting",
      visits: "3–5 visits",
      placeholderHint: "denture set photo",
      description:
        "Full or partial dentures replace missing teeth and restore chewing and speech. Each set is measured and adjusted for a comfortable fit.",
      steps: ["Impressions", "Try-in", "Final fit and adjustments"],
      goodFor: "One or many missing teeth.",
    },
    {
      id: "crowns-bridges",
      name: "Crowns & Bridges",
      images: [],
      duration: "60 min",
      visits: "2 visits",
      placeholderHint: "crown / bridge photo",
      description:
        "Crowns cap and protect weak or broken teeth; bridges fill the gap left by a missing tooth using neighbouring teeth for support.",
      steps: ["Prepare tooth", "Temporary cap", "Fit permanent crown"],
      goodFor: "Cracked, weak or missing teeth.",
    },
    {
      id: "whitening",
      name: "Teeth Whitening",
      images: [],
      duration: "60 min",
      visits: "1 visit",
      placeholderHint: "before / after whitening",
      description:
        "In-clinic whitening lifts stains from coffee, tea and age, brightening your smile by several shades in a single session.",
      steps: ["Shade check", "Protect gums", "Whitening session"],
      goodFor: "Stained or dull teeth.",
    },
  ],
  dentists: [
    {
      id: "camacho",
      shortName: "Dr. Camacho",
      name: "Dr. Camacho",
      role: "Founding dentist",
      bio: "Leads the clinic and its supplies service, with a focus on general and restorative dentistry for families in Antipolo.",
      tags: ["General", "Restorative", "Dentures"],
      photo: "/images/dentist-1.png",
      hue: 175,
      hours: [null, [9, 17], [9, 17], [9, 17], [9, 17], [9, 17], [9, 15]],
    },
    {
      id: "orthodontist",
      shortName: "Orthodontist",
      name: "Dr. [Name]",
      role: "Associate dentist",
      bio: "Handles orthodontic cases and long-term braces care, from first consult through monthly adjustments.",
      tags: ["Orthodontics", "Braces"],
      photo: "/images/dentist-2.png",
      hue: 75,
      hours: [null, null, [10, 16], null, [10, 16], null, [9, 15]],
    },
    {
      id: "pediatric",
      shortName: "Pediatric dentist",
      name: "Dr. [Name]",
      role: "Associate dentist",
      bio: "Sees younger patients and first-time visitors, keeping appointments calm and easy to understand.",
      tags: ["Pediatric", "Preventive"],
      photo: "/images/dentist-3.png",
      hue: 300,
      hours: [[9, 12], [13, 18], null, [13, 18], null, [13, 18], null],
    },
  ],
  faqs: [
    {
      id: "walk-in",
      question: "Do I need an appointment, or can I walk in?",
      answer:
        "Walk-ins are welcome, but booking ahead means shorter waiting. Send a request below or message us on Facebook and we will confirm a time.",
    },
    {
      id: "hours",
      question: "What are your clinic hours?",
      answer: "We are open daily. Hours can change on holidays, so message or call 0927 771 5208 before you visit.",
    },
    {
      id: "cost",
      question: "How much does a treatment cost?",
      answer: "Prices depend on the case. We give you a clear quote after your check-up, before any work begins.",
    },
    {
      id: "children",
      question: "Do you treat children?",
      answer:
        "Yes. We see kids for check-ups, cleaning, fillings and extractions, and we take extra time to keep first visits comfortable.",
    },
    {
      id: "payment",
      question: "What payment methods do you accept?",
      answer: "Cash and common e-wallets. Ask us about staged payments for braces and dentures.",
    },
    {
      id: "supplies",
      question: "Do you sell dental supplies?",
      answer:
        "Yes. C.M.E. Camacho also supplies materials and instruments to dentists and dental students. Email cmec.dental@gmail.com for stock and pricing.",
    },
  ],
  booking: {
    timesOfDay: ["Morning", "Afternoon", "Evening"],
    defaultTreatmentId: "prophylaxis",
    simulateBusySlots: true,
  },
  footer: {
    copyright: "© 2026 C.M.E. Camacho Dental Clinic · Antipolo, Rizal",
    links: [
      { label: "Facebook ↗", href: "https://www.facebook.com/cmecamachoclinic/" },
      { label: "Messenger ↗", href: "https://m.me/cmecamachoclinic" },
      { label: "TikTok ↗", href: "https://www.tiktok.com/@cmecamachodental" },
      { label: "Email", href: "mailto:cmec.dental@gmail.com" },
    ],
  },
}
