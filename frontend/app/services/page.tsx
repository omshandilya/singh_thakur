import Link from "next/link";
import { services } from "../../data/services";
import { ShieldCheck, TrendingUp, Briefcase, FileText } from 'lucide-react';

const icons = {
  FileText: FileText,
  Briefcase: Briefcase,
  ShieldCheck: ShieldCheck,
  Calculator: TrendingUp,
  Building: Briefcase,
};

export default function ServicesPage() {
  return (
    <div className="py-20 bg-white min-h-screen">
      <div className="container mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
        <div className="text-center mb-16">
          <h1 className="text-4xl font-bold text-slate-900 mb-4">Our Services</h1>
          <p className="text-lg text-slate-600 max-w-2xl mx-auto">
            Comprehensive financial, auditing, and tax advisory services tailored for modern enterprises.
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
          {services.map((service) => {
            const Icon = icons[service.iconName as keyof typeof icons] || FileText;
            return (
              <Link key={service.id} href={`/services/${service.slug}`} className="group block h-full">
                <div className="bg-slate-50 border border-slate-200 rounded-xl p-8 h-full transition-all duration-300 hover:shadow-lg hover:bg-white hover:border-slate-300">
                  <div className="h-12 w-12 bg-white rounded-lg border border-slate-200 flex items-center justify-center mb-6 group-hover:border-slate-900 transition-colors">
                    <Icon className="h-6 w-6 text-slate-700 group-hover:text-slate-900 transition-colors" />
                  </div>
                  <h3 className="text-xl font-bold text-slate-900 mb-3">{service.title}</h3>
                  <p className="text-slate-600 leading-relaxed text-sm mb-6">
                    {service.shortDescription}
                  </p>
                  <span className="text-sm font-semibold text-slate-900 group-hover:underline">
                    Learn more &rarr;
                  </span>
                </div>
              </Link>
            );
          })}
        </div>
      </div>
    </div>
  );
}
