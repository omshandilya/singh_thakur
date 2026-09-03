import Link from 'next/link';
import { Button } from '../components/ui/button';
import { services } from '../data/services';
import { ShieldCheck, TrendingUp, Users, Clock, Briefcase, FileText } from 'lucide-react';

const icons = {
  FileText: FileText,
  Briefcase: Briefcase,
  ShieldCheck: ShieldCheck,
  Calculator: TrendingUp,
  Building: Briefcase,
};

export default function Home() {
  return (
    <div className="flex flex-col w-full">
      {/* Hero Section */}
      <section className="relative bg-slate-900 py-20 lg:py-32 overflow-hidden">
        <div className="absolute inset-0 z-0">
          <div className="absolute inset-0 bg-slate-900/90 mix-blend-multiply" />
          {/* Subtle grid pattern for premium corporate look */}
          <div className="h-full w-full bg-[linear-gradient(to_right,#80808012_1px,transparent_1px),linear-gradient(to_bottom,#80808012_1px,transparent_1px)] bg-[size:24px_24px]"></div>
        </div>
        <div className="container relative z-10 mx-auto max-w-7xl px-4 sm:px-6 lg:px-8 flex flex-col items-center text-center">
          <h1 className="text-4xl md:text-6xl font-bold tracking-tight text-white max-w-4xl leading-tight">
            Excellence in <span className="text-slate-300">Financial Advisory</span> & Compliance.
          </h1>
          <p className="mt-6 text-lg md:text-xl text-slate-400 max-w-2xl font-light">
            We provide strategic tax planning, rigorous auditing, and comprehensive corporate compliance services to empower your business growth.
          </p>
          <div className="mt-10 flex flex-col sm:flex-row gap-4">
            <Link href="/book-consultation">
              <Button size="lg" className="w-full sm:w-auto bg-white text-slate-900 hover:bg-slate-200 font-semibold px-8 h-12 text-base">
                Book a Consultation
              </Button>
            </Link>
            <Link href="/services">
              <Button size="lg" variant="outline" className="w-full sm:w-auto border-slate-600 text-slate-300 hover:text-white hover:bg-slate-800 bg-transparent h-12 text-base px-8">
                Explore Services
              </Button>
            </Link>
          </div>
        </div>
      </section>

      {/* Trust Indicators */}
      <section className="bg-white py-12 border-b border-slate-200">
        <div className="container mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
          <div className="grid grid-cols-2 md:grid-cols-4 gap-8 text-center divide-x divide-slate-100">
            <div>
              <p className="text-4xl font-bold text-slate-900">25+</p>
              <p className="text-sm font-medium text-slate-500 mt-2">Years Experience</p>
            </div>
            <div>
              <p className="text-4xl font-bold text-slate-900">500+</p>
              <p className="text-sm font-medium text-slate-500 mt-2">Clients Served</p>
            </div>
            <div>
              <p className="text-4xl font-bold text-slate-900">12+</p>
              <p className="text-sm font-medium text-slate-500 mt-2">Industries</p>
            </div>
            <div>
              <p className="text-4xl font-bold text-slate-900">30+</p>
              <p className="text-sm font-medium text-slate-500 mt-2">Professionals</p>
            </div>
          </div>
        </div>
      </section>

      {/* Services Overview */}
      <section className="py-20 bg-slate-50">
        <div className="container mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-16">
            <h2 className="text-3xl font-bold text-slate-900">Our Core Services</h2>
            <p className="mt-4 text-slate-600 max-w-2xl mx-auto">Comprehensive solutions tailored to your complex financial and regulatory needs.</p>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
            {services.slice(0, 6).map((service) => {
              const Icon = icons[service.iconName as keyof typeof icons] || FileText;
              return (
                <Link key={service.id} href={`/services/${service.slug}`} className="group block h-full">
                  <div className="bg-white border border-slate-200 rounded-xl p-8 h-full transition-all duration-300 hover:shadow-lg hover:border-slate-300">
                    <div className="h-12 w-12 bg-slate-100 rounded-lg flex items-center justify-center mb-6 group-hover:bg-slate-900 transition-colors">
                      <Icon className="h-6 w-6 text-slate-700 group-hover:text-white transition-colors" />
                    </div>
                    <h3 className="text-xl font-semibold text-slate-900 mb-3">{service.title}</h3>
                    <p className="text-slate-600 leading-relaxed text-sm">
                      {service.shortDescription}
                    </p>
                  </div>
                </Link>
              );
            })}
          </div>
          <div className="mt-12 text-center">
            <Link href="/services">
              <Button variant="outline" className="border-slate-300 text-slate-700">View All Services</Button>
            </Link>
          </div>
        </div>
      </section>

      {/* Why Choose Us */}
      <section className="py-20 bg-white border-t border-slate-200">
        <div className="container mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-16 items-center">
            <div>
              <h2 className="text-3xl font-bold text-slate-900 mb-6">Why Partner With Us?</h2>
              <p className="text-slate-600 mb-8 leading-relaxed">
                We believe in building long-term relationships based on trust, transparency, and technical excellence. Our approach goes beyond mere compliance.
              </p>
              <ul className="space-y-6">
                {[
                  { icon: Users, title: 'Experienced Professionals', desc: 'Led by seasoned partners with decades of industry expertise.' },
                  { icon: ShieldCheck, title: 'Secure & Confidential', desc: 'Strict protocols to ensure your financial data is completely secure.' },
                  { icon: Clock, title: 'Timely Delivery', desc: 'Commitment to meeting strict statutory deadlines without compromising quality.' },
                ].map((item, i) => (
                  <li key={i} className="flex gap-4">
                    <div className="flex-shrink-0 mt-1">
                      <div className="h-10 w-10 bg-slate-100 rounded-full flex items-center justify-center">
                        <item.icon className="h-5 w-5 text-slate-700" />
                      </div>
                    </div>
                    <div>
                      <h4 className="font-semibold text-slate-900">{item.title}</h4>
                      <p className="text-sm text-slate-600 mt-1">{item.desc}</p>
                    </div>
                  </li>
                ))}
              </ul>
            </div>
            <div className="bg-slate-100 rounded-2xl h-96 w-full flex items-center justify-center border border-slate-200 overflow-hidden relative">
               <div className="absolute inset-0 bg-slate-200/50 flex items-center justify-center">
                 <span className="text-slate-500 font-medium">[Professional Firm Image Placeholder]</span>
               </div>
            </div>
          </div>
        </div>
      </section>

      {/* CTA Section */}
      <section className="bg-slate-900 py-20 text-center">
        <div className="container mx-auto max-w-4xl px-4 sm:px-6 lg:px-8">
          <h2 className="text-3xl font-bold text-white mb-6">Ready to streamline your financial operations?</h2>
          <p className="text-slate-400 mb-10 text-lg">
            Schedule a consultation with our partners to discuss how we can assist your business.
          </p>
          <Link href="/book-consultation">
            <Button size="lg" className="bg-white text-slate-900 hover:bg-slate-200 font-semibold px-10 h-12">
              Book Your Consultation
            </Button>
          </Link>
        </div>
      </section>
    </div>
  );
}
