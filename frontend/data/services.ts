import { Service } from "../types";

export const services: Service[] = [
  {
    id: "income-tax",
    title: "Income Tax",
    slug: "income-tax",
    shortDescription: "Comprehensive tax planning, filing, and advisory for individuals and corporations.",
    fullDescription: "Our Income Tax services ensure that your financial strategies are optimized for tax efficiency while remaining fully compliant with the latest regulations. We provide personalized planning and robust representation.",
    iconName: "FileText",
    whatWeHandle: [
      "Corporate Tax Return Filing",
      "Individual Tax Planning",
      "Tax Assessments & Appeals",
      "International Taxation & Transfer Pricing",
      "TDS/TCS Compliance"
    ],
    whoIsItFor: [
      "Corporations seeking tax optimization",
      "High Net Worth Individuals (HNIs)",
      "Expatriates and NRIs",
      "Partnership Firms and LLPs"
    ],
    process: [
      { title: "Initial Review", description: "Analyzing previous returns and current financial standing." },
      { title: "Strategy Formulation", description: "Developing a tax-efficient plan tailored to your goals." },
      { title: "Documentation", description: "Collecting and verifying all necessary financial documents." },
      { title: "Filing & Compliance", description: "Accurate preparation and timely filing of tax returns." }
    ],
    faqs: [
      { question: "What documents do I need for corporate tax filing?", answer: "Typically, you need financial statements (Balance Sheet, P&L), bank statements, audit reports, and details of TDS." },
      { question: "Can you represent us in tax disputes?", answer: "Yes, our team handles tax litigation, assessments, and appeals at various appellate levels." }
    ]
  },
  {
    id: "gst",
    title: "GST Compliance & Advisory",
    slug: "gst",
    shortDescription: "End-to-end Goods and Services Tax (GST) solutions from registration to annual audits.",
    fullDescription: "Navigate the complexities of GST with our expert advisory and compliance services. We help businesses minimize tax cascading effects, ensure timely filings, and manage departmental audits.",
    iconName: "Briefcase",
    whatWeHandle: [
      "GST Registration & Modifications",
      "Monthly/Quarterly Return Filing (GSTR-1, GSTR-3B)",
      "Annual Return (GSTR-9) & Audit (GSTR-9C)",
      "GST Refund Claims",
      "Departmental Notices & Representation"
    ],
    whoIsItFor: [
      "Manufacturers and Traders",
      "Service Providers",
      "E-commerce Operators",
      "Importers and Exporters"
    ],
    process: [
      { title: "Onboarding", description: "Understanding your supply chain and business model." },
      { title: "Data Processing", description: "Reconciling purchase/sales data (GSTR-2A/2B matching)." },
      { title: "Return Preparation", description: "Drafting returns and calculating accurate tax liability." },
      { title: "Filing & Advisory", description: "Filing returns and advising on GST implications of new transactions." }
    ],
    faqs: [
      { question: "Is GST registration mandatory?", answer: "It is mandatory if your aggregate turnover exceeds the threshold limit, or if you engage in inter-state supply, among other criteria." },
      { question: "How often do I need to file GST returns?", answer: "Depending on your turnover and scheme (e.g., QRMP), returns are filed monthly or quarterly." }
    ]
  },
  {
    id: "audit",
    title: "Audit & Assurance",
    slug: "audit",
    shortDescription: "Independent, objective audits to enhance the reliability of your financial statements.",
    fullDescription: "Our Audit and Assurance services go beyond compliance. We provide deep insights into your financial health, internal controls, and operational efficiency, building trust with your stakeholders.",
    iconName: "ShieldCheck",
    whatWeHandle: [
      "Statutory Audits under Companies Act",
      "Tax Audits under Income Tax Act",
      "Internal Audits & Risk Advisory",
      "Management & Operational Audits",
      "Due Diligence"
    ],
    whoIsItFor: [
      "Private and Public Limited Companies",
      "Banks and Financial Institutions",
      "NGOs and Trusts",
      "Firms requiring independent financial verification"
    ],
    process: [
      { title: "Planning & Risk Assessment", description: "Identifying key risk areas and audit scope." },
      { title: "Fieldwork", description: "Testing internal controls and substantive checking of transactions." },
      { title: "Review & Analysis", description: "Evaluating findings against statutory requirements." },
      { title: "Reporting", description: "Issuing the independent auditor's report and management letter." }
    ],
    faqs: [
      { question: "What is the difference between statutory and internal audit?", answer: "Statutory audit is legally required to report on financial statements to shareholders. Internal audit is management-driven to evaluate internal controls." },
      { question: "How long does a statutory audit take?", answer: "The timeline depends on the size and complexity of the business, typically ranging from a few weeks to a couple of months." }
    ]
  },
  {
    id: "accounting",
    title: "Accounting & Bookkeeping",
    slug: "accounting",
    shortDescription: "Accurate, timely, and compliant financial record-keeping for your business.",
    fullDescription: "Outsource your accounting functions to our experts. We ensure your financial records are maintained accurately, providing you with real-time financial data to make informed business decisions.",
    iconName: "Calculator",
    whatWeHandle: [
      "Day-to-day Bookkeeping",
      "Bank Reconciliation",
      "Payroll Processing",
      "Preparation of Financial Statements",
      "MIS Reporting"
    ],
    whoIsItFor: [
      "Startups & SMEs",
      "Foreign companies with Indian subsidiaries",
      "Businesses seeking to reduce administrative overhead"
    ],
    process: [
      { title: "System Setup", description: "Configuring accounting software (e.g., Tally, QuickBooks)." },
      { title: "Data Entry", description: "Recording all financial transactions systematically." },
      { title: "Reconciliation", description: "Matching accounts with bank statements and vendor ledgers." },
      { title: "Reporting", description: "Generating monthly or quarterly MIS and financial reports." }
    ],
    faqs: [
      { question: "Can you use our existing accounting software?", answer: "Yes, our team is proficient in major accounting platforms including Tally, Zoho Books, QuickBooks, and Xero." },
      { question: "How secure is our financial data?", answer: "We use secure, encrypted channels for data transfer and maintain strict confidentiality agreements." }
    ]
  },
  {
    id: "business-compliance",
    title: "Business Compliance",
    slug: "business-compliance",
    shortDescription: "Company incorporation, ROC filings, and regulatory compliance services.",
    fullDescription: "From registering your startup to handling ongoing corporate governance, our compliance team ensures your business adheres to all MCA and regulatory requirements.",
    iconName: "Building",
    whatWeHandle: [
      "Company/LLP Incorporation",
      "Annual ROC Filings (AOC-4, MGT-7)",
      "Director DIN & KYC",
      "Changes in Corporate Structure",
      "FEMA / RBI Compliances"
    ],
    whoIsItFor: [
      "New Entrepreneurs & Startups",
      "Existing Companies and LLPs",
      "Foreign Direct Investors (FDI)"
    ],
    process: [
      { title: "Consultation", description: "Advising on the best business structure." },
      { title: "Documentation", description: "Preparing MoA, AoA, and required declarations." },
      { title: "Filing", description: "Submitting forms with the Ministry of Corporate Affairs (MCA)." },
      { title: "Ongoing Support", description: "Managing secretarial records and annual compliances." }
    ],
    faqs: [
      { question: "How long does it take to register a Private Limited Company?", answer: "Typically 7-10 working days, subject to document readiness and MCA processing times." },
      { question: "What are the mandatory annual filings for a company?", answer: "Companies must file annual accounts (AOC-4) and annual return (MGT-7), hold board meetings, and conduct an AGM." }
    ]
  }
];
