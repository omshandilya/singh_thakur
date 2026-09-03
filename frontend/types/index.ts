export interface NavItem {
  title: string;
  href: string;
}

export interface SiteConfig {
  name: string;
  description: string;
  mainNav: NavItem[];
  links: {
    twitter: string;
    linkedin: string;
  };
  contact: {
    email: string;
    phone: string;
    address: string;
    hours: string;
  };
}

export interface ServiceProcess {
  title: string;
  description: string;
}

export interface ServiceFAQ {
  question: string;
  answer: string;
}

export interface Service {
  id: string;
  title: string;
  slug: string;
  shortDescription: string;
  fullDescription: string;
  iconName: string; 
  whatWeHandle: string[];
  whoIsItFor: string[];
  process: ServiceProcess[];
  faqs: ServiceFAQ[];
}

export interface TeamMember {
  id: string;
  name: string;
  designation: string;
  shortBio: string;
  qualifications: string[];
  linkedinUrl: string;
  photoUrl: string;
}
