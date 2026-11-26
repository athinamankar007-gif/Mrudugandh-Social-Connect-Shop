import { useGetSiteContent, getGetSiteContentQueryKey } from '@workspace/api-client-react';

const DEFAULT_TEXTS: Record<string, string> = {
  aboutEyebrow: "The heart of the shop",
  aboutTitle: "More than a Product - A Connection.",
  tagline: "Handmade with Purpose. Connected with Heart.",
  aboutCallout: "A product carries more when you know where it begins.",
  aboutParagraph1: "Mrudugandh Social Connect is a social enterprise initiative dedicated to creating sustainable market access for grassroots products, women entrepreneurs, and traditional artisans.",
  aboutParagraph2: "मृदुगंध सोशल कनेक्ट ही एक सामाजिक उपक्रम संस्था आहे, जी ग्रामीण कारागीर, महिला उद्योजक आणि बचत गटांना थेट बाजारपेठ उपलब्ध करून देण्यासाठी कार्यरत आहे.",
  aboutQuote: "Choose the things that make room for a story.",
  missionTitle: "Our Mission",
  missionBody: "Empowering local artisans and self-help groups through fair, direct-to-consumer market access and eco-conscious craftsmanship.",
  initiativesTitle: "Our Initiatives & Network",
  initiativesIntro: "Connecting grassroots products, women entrepreneurs, artisans, underprivileged communities, and urban customers through purposeful action.",
  coreHeading: "Core Initiatives Profile",
  impactHeading: "Social & Environmental Impact",
  environmentalNote: "To reduce plastic waste, we do not use plastic bags. All customer purchases are packaged in reusable cloth bags stitched from old sarees.",
  studentHeading: "Student Internships & Community-Based Learning",
  studentIntro: "We are proud to collaborate with educational institutions, offering students hands-on community-based learning experiences.",
  networkHeading: "Our Network & Associations",
  networkIntro: "The strength of our impact lies in the partnerships we've built.",
  supportHeading: "We Support",
  exhibitionHeading: "Exhibitions",
  corporateHeading: "Corporate Partners",
};

const DEFAULT_PARTNERS = [
  ...["Yavatmal tribal women", "Melghat tribal brothers", "India Sponsorship Committee", "Kashvi Self Help Group", "Aarogyam Foundation", "Carvea Foundation"].map((name, index) => ({ id: `exhibition-${index}`, name, group: "exhibition", logoPath: "", sortOrder: index })),
  ...["Udaan", "Pune Shopping Festival", "Puneri Saaz"].map((name, index) => ({ id: `corporate-${index}`, name, group: "corporate", logoPath: "", sortOrder: index })),
  ...["Infosys", "HSBC", "Mastercard", "Tech Mahindra"].map((name, index) => ({ id: `tech-${index}`, name, group: "corporate", logoPath: "", sortOrder: index + 10 })),
  ...["Fergusson College", "Symbiosis College", "Garware College", "Wadia College", "Modern College", "SP College"].map((name, index) => ({ id: `college-${index}`, name, group: "college", logoPath: "", sortOrder: index })),
];

const DEFAULT_INITIATIVES = [
  { id: "product-selling", section: "core", title: "Product Selling", eyebrow: "Empowerment", sortOrder: 0, body: "Our online store serves as a direct bridge between traditional craftsmanship and conscious consumers. We focus on the empowerment of local artisans, providing sustainable livelihoods.", imagePaths: ["asset:sewing", "asset:exhibition"] },
  { id: "corporate-csr", section: "csr", title: "Employee Engagement (CSR)", eyebrow: "Corporate Partnerships", sortOrder: 1, body: "We partner with organizations to conduct meaningful corporate social responsibility activities. Teams join us for hands-on, creative sessions including gullak painting.", imagePaths: ["asset:gullak-workshop", "asset:gullak-display", "asset:gullak-painting"] },
  { id: "student-community", section: "student", title: "Student Community Engagement", eyebrow: "Learning through community", sortOrder: 2, body: "Students take part in exhibitions, community work, and hands-on learning alongside Mrudugandh Social Connect.", imagePaths: ["asset:student-stall-one", "asset:student-stall-two", "asset:student-work", "asset:student-community", "asset:student-new-stall"] },
  { id: "donation-drives", section: "core", title: "Donation Drives", eyebrow: "Giving Back", sortOrder: 3, body: "We organize drives to collect clothes and upcycle old sarees. We are currently raising funds for an Eco Utility Vehicle for the Tanabana project to secure transport.", imagePaths: ["asset:donation-clothes", "asset:tanabana-vehicle"] },
  { id: "social-activities", section: "impact", title: "Social Activities", eyebrow: "Community Outreach", sortOrder: 4, body: "Our social activities directly impact the lives of rural children. We organize distribution drives to provide essential school kits and beautifully painted gullaks.", imagePaths: ["asset:gullak-display"] },
];

export function useSiteContent() {
  const q = useGetSiteContent({ query: { queryKey: getGetSiteContentQueryKey(), retry: false } });
  const texts = q.data?.story?.texts && Object.keys(q.data.story.texts).length > 0 ? q.data.story.texts : DEFAULT_TEXTS;
  const partners = q.data?.partners && q.data.partners.length > 0 ? q.data.partners : DEFAULT_PARTNERS;
  const initiatives = q.data?.initiatives && q.data.initiatives.length > 0 ? q.data.initiatives : DEFAULT_INITIATIVES;

  return {
    isLoading: false,
    isError: false,
    refetch: q.refetch,
    loaded: true,
    t: (key: string) => texts[key] ?? DEFAULT_TEXTS[key] ?? '',
    partners: [...partners].sort((a, b) => a.sortOrder - b.sortOrder),
    initiatives: [...initiatives].sort((a, b) => a.sortOrder - b.sortOrder),
  };
}
