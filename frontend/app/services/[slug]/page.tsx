import { services } from "../../../data/services";
import { notFound } from "next/navigation";
import Link from "next/link";
import { Button } from "../../../components/ui/button";
import { ShieldCheck, TrendingUp, Briefcase, FileText, CheckCircle2 } from 'lucide-react';

const icons = {
  FileText: FileText,
  Briefcase: Briefcase,
  ShieldCheck: ShieldCheck,
  Calculator: TrendingUp,
  Building: Briefcase,
};

// Generate static params for all services
export function generateStaticParams() {
  return services.map((service) => ({
    slug: service.slug,
  }));
}

export default function ServiceDetailPage({ params }: { params: { slug: string } }) {
  const service = services.find((s) => s.slug === params.slug);

  if (!service) {
    notFound();
  }

  const Icon = icons[service.iconName as keyof typeof icons] || FileText;

  return (
    <div className="bg-white">
      {/* Service Hero */}
      <div className="bg-slate-900 py-20 text-white">
        <div className="container mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
          <div className="max-w-3xl">
            <div className="h-12 w-12 bg-white/10 rounded-lg flex items-center justify-center mb-6">
              <Icon className="h-6 w-6 text-white" />
            </div>
            <h1 className="text-4xl md:text-5xl font-bold mb-6">{service.title}</h1>
            <p className="text-xl text-slate-300 leading-relaxed">
              {service.fullDescription}
            </p>
          </div>
        </div>
      </div>

      <div className="container mx-auto max-w-7xl px-4 sm:px-6 lg:px-8 py-20">
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-12">
          
          {/* Main Content */}
          <div className="lg:col-span-2 space-y-16">
            <section>
              <h2 className="text-2xl font-bold text-slate-900 mb-6">What We Handle</h2>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                {service.whatWeHandle.map((item, idx) => (
                  <div key={idx} className="flex items-start">
                    <CheckCircle2 className="h-5 w-5 text-slate-700 mr-3 shrink-0 mt-0.5" />
                    <span className="text-slate-600">{item}</span>
                  </div>
                ))}
              </div>
            </section>

            <section>
              <h2 className="text-2xl font-bold text-slate-900 mb-6">Our Process</h2>
              <div className="space-y-8">
                {service.process.map((step, idx) => (
                  <div key={idx} className="flex">
                    <div className="flex flex-col items-center mr-6">
                      <div className="h-8 w-8 rounded-full bg-slate-100 flex items-center justify-center font-bold text-slate-900 text-sm border border-slate-200">
                        {idx + 1}
                      </div>
                      {idx !== service.process.length - 1 && (
                        <div className="w-px h-full bg-slate-200 mt-2"></div>
                      )}
                    </div>
                    <div className="pb-8">
                      <h3 className="text-lg font-semibold text-slate-900">{step.title}</h3>
                      <p className="mt-2 text-slate-600">{step.description}</p>
                    </div>
                  </div>
                ))}
              </div>
            </section>

            <section>
              <h2 className="text-2xl font-bold text-slate-900 mb-6">Frequently Asked Questions</h2>
              <div className="space-y-6">
                {service.faqs.map((faq, idx) => (
                  <div key={idx} className="bg-slate-50 p-6 rounded-xl border border-slate-100">
                    <h3 className="text-lg font-medium text-slate-900 mb-2">{faq.question}</h3>
                    <p className="text-slate-600">{faq.answer}</p>
                  </div>
                ))}
              </div>
            </section>
          </div>

          {/* Sidebar */}
          <div className="lg:col-span-1">
            <div className="sticky top-28 bg-slate-50 p-8 rounded-2xl border border-slate-200">
              <h3 className="text-xl font-bold text-slate-900 mb-4">Who is this for?</h3>
              <ul className="space-y-3 mb-8">
                {service.whoIsItFor.map((item, idx) => (
                  <li key={idx} className="flex items-start text-sm text-slate-600">
                    <span className="mr-2 text-slate-400">•</span>
                    {item}
                  </li>
                ))}
              </ul>
              <div className="pt-8 border-t border-slate-200">
                <h4 className="font-semibold text-slate-900 mb-4">Ready to get started?</h4>
                <Link href="/book-consultation">
                  <Button className="w-full bg-slate-900 text-white hover:bg-slate-800">
                    Book Consultation
                  </Button>
                </Link>
              </div>
            </div>
          </div>

        </div>
      </div>
    </div>
  );
}
