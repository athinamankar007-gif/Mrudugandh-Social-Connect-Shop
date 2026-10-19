// Stable asset keys are resolved to bundled images by the storefront.
// Seed once; later changes belong to the CMS, never to an on-conflict update.
export const defaultStoryTexts: Record<string, string> = {
  aboutEyebrow: "The heart of the shop",
  aboutTitle: "More Than a Product — A Connection.",
  tagline: "Handmade with Purpose. Connected with Heart.",
  aboutCallout: "A product carries more when you know where it begins.",
  aboutParagraphEn: "Mrudugandh Social Connect is a social enterprise initiative dedicated to creating sustainable market access for grassroots producers, women entrepreneurs, artisans, underprivileged individuals and community-based organisations. We work as a bridge between those who create and those who consume—bringing authentic handmade products and community-led enterprises into urban markets through exhibitions, stalls, promotional campaigns and direct customer outreach.",
  aboutParagraphMr: "मृदुगंध सोशल कनेक्ट ही केवळ एक बाजारपेठ नाही, तर आपल्या मातीशी आणि माणसांशी जोडणारा एक सेतू आहे. तळागाळातील कारागीर, कष्टकरी महिला आणि स्थानिक उत्पादकांच्या हातातील कलेला हक्काचे व्यासपीठ मिळवून देणे, हा आमचा ध्यास आहे. प्रदर्शने, स्टॉल्स आणि थेट ग्राहकांपर्यंत पोहोचून आम्ही अस्सल हस्तकलेला शहराच्या घराघरांपर्यंत पोहोचवत आहोत.",
  aboutBanner: "Choose the things that make room for a story.",
  missionEn: "",
  missionMr: "",
  initiativesTitle: "Our Initiatives & Network",
  initiativesIntro: "Connecting grassroots producers, women entrepreneurs, artisans, underprivileged communities, and urban customers through purposeful action.",
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

export const defaultPartners = [
  ...["Yavatmal tribal women", "Melghat tribal brothers", "India Sponsorship Committee", "Kashvi Self Help Group", "Aurogyan Foundation", "Corvee Foundation"].map((name, index) => ({ id: `support-${index}`, name, group: "support", logoPath: "", sortOrder: index })),
  ...["Udaan", "Pune Shopping Festival", "Puneri Saaz"].map((name, index) => ({ id: `exhibition-${index}`, name, group: "exhibition", logoPath: "", sortOrder: index })),
  ...["Infosys", "Persistent", "HSBC", "Mastercard", "Tech Mahindra"].map((name, index) => ({ id: `corporate-${index}`, name, group: "corporate", logoPath: "", sortOrder: index })),
  ...["Fergusson College", "Symbiosis College", "Garware College", "Wadia College", "Modern College", "SP College"].map((name, index) => ({ id: `college-${index}`, name, group: "college", logoPath: "", sortOrder: index })),
];

export const defaultInitiatives = [
  {
    id: "product-selling", section: "core", title: "Product Selling", eyebrow: "Empowerment", sortOrder: 0,
    body: "Our online store serves as a direct bridge between traditional craftsmanship and conscious consumers. We focus on the empowerment of local artisans, providing them with a platform to showcase their skills, reach a wider audience, and build sustainable livelihoods through their craft.",
    imagePaths: ["asset:sewing", "asset:exhibition"],
  },
  {
    id: "corporate-csr", section: "csr", title: "Employee Engagement (CSR)", eyebrow: "Corporate Partnerships", sortOrder: 1,
    body: "We partner with organizations to conduct meaningful corporate social responsibility activities. Teams join us for hands-on, creative sessions including gullak painting, bag painting, and diya painting—fostering teamwork while creating beautiful items for a cause.",
    imagePaths: ["asset:gullak-workshop", "asset:gullak-display", "asset:gullak-painting"],
  },
  {
    id: "student-community", section: "student", title: "Student Community Engagement", eyebrow: "Learning through community", sortOrder: 2,
    body: "Students take part in exhibitions, community work, and hands-on learning alongside Mrudugandh Social Connect.",
    imagePaths: ["asset:student-stall-one", "asset:student-stall-two", "asset:student-work", "asset:student-community", "asset:student-new-stall"],
  },
  {
    id: "donation-drives", section: "core", title: "Donation Drives", eyebrow: "Giving Back", sortOrder: 3,
    body: "We organize drives to collect clothes and upcycle old sarees. We are currently raising funds for an Eco Utility Vehicle for the Tanabana project to secure transportation for 104 tribal families.",
    imagePaths: ["asset:donation-clothes", "asset:tanabana-vehicle"],
  },
  {
    id: "social-activities", section: "impact", title: "Social Activities", eyebrow: "Community Outreach", sortOrder: 4,
    body: "Our social activities directly impact the lives of rural children. We organize distribution drives to provide essential school kits and beautifully painted gullaks to encourage education and the habit of saving from a young age.",
    imagePaths: ["asset:gullak-display"],
  },
];
