// Single source of truth for the homepage FAQ. Consumed by:
//   - HomeStaticShell  (renders the visible sr-only Q&A prose)
//   - HomeRouteSchemas (emits the FAQPage JSON-LD)
// Keeping both surfaces driven by this one list guarantees the structured data
// and the on-page text never drift apart.

export type HomeFaqItem = { question: string; answer: string };

export const HOME_FAQ: HomeFaqItem[] = [
  {
    question: "What's growthepie?",
    answer:
      "growthepie is the open analytics platform for the Ethereum ecosystem — empowering builders with actionable insights to grow the pie. From Mainnet to Layer 2s and onchain applications, explore open data on usage, growth, and adoption.",
  },
  {
    question: 'What\'s up with the name "growthepie"?',
    answer:
      'We view Ethereum\'s different scaling solutions as complementary technologies for the ecosystem that enable more use cases, rather than competitors vying for market share. We believe the space is a positive-sum game where each unique flavor of Layer 2 technology brings its own benefits, and together they are "growing the pie" for everyone. Our brand name is always one word and lowercase: growthepie.',
  },
  {
    question:
      "What's the difference between Ethereum Mainnet and the Ethereum ecosystem?",
    answer:
      "Ethereum Mainnet, also called Ethereum L1, is the Ethereum blockchain that launched in 2015. The Ethereum ecosystem includes many blockchains built on top of Ethereum Mainnet (Layer 2s). These blockchains settle to Ethereum Mainnet and benefit from some of its security guarantees. Not all of these chains run the EVM — Layer 2s can also use other VMs (CairoVM, SVM, FuelVM, etc.). Settling to Ethereum Mainnet defines the ecosystem, not the VM.",
  },
  {
    question: "What are Quick Bites?",
    answer:
      "Quick Bites are short, data-driven articles on specific topics or trends in the Ethereum ecosystem. You can browse all of them on the Quick Bites page at growthepie.com/quick-bites.",
  },
  {
    question: "Are the dates on this website my regional timezone or UTC?",
    answer:
      "All dates on our website use UTC time. This makes it easier to aggregate data and avoid confusion when people in different timezones share charts.",
  },
];
