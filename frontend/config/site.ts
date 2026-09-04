import { SiteConfig } from "../types";

export const siteConfig: SiteConfig = {
  name: "Singh & Thakur Associates",
  description:
    "Premium Indian Chartered Accountant and Financial Advisory firm delivering excellence in taxation, auditing, and corporate compliance.",
  mainNav: [
    { title: "Home", href: "/" },
    { title: "About", href: "/about" },
    { title: "Services", href: "/services" },
    { title: "Team", href: "/team" },
    { title: "Resources", href: "/resources" },
    { title: "Contact", href: "/contact" },
  ],
  links: {
    twitter: "https://twitter.com",
    linkedin: "https://linkedin.com",
  },
  contact: {
    email: "contact@singhandthakur.com",
    phone: "+91 11 4567 8900",
    address: "14, Barakhamba Road, Connaught Place, New Delhi, India 110001",
    hours: "Mon - Fri: 9:30 AM - 6:30 PM",
  },
};
