import Link from "next/link";
import { siteConfig } from "../../config/site";
import { services } from "../../data/services";
import { Mail, Phone, MapPin } from "lucide-react";

export function Footer() {
  return (
    <footer className="border-t bg-slate-50">
      <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8 py-12 lg:py-16">
        <div className="grid grid-cols-1 gap-8 lg:grid-cols-4">
          
          {/* Brand & Intro */}
          <div className="lg:col-span-1">
            <Link href="/" className="flex items-center space-x-2 mb-4">
              <div className="h-8 w-8 bg-slate-900 rounded-sm flex items-center justify-center text-white font-bold">
                S&T
              </div>
              <span className="font-bold text-xl text-slate-900 tracking-tight">
                {siteConfig.name}
              </span>
            </Link>
            <p className="mt-4 text-sm leading-6 text-slate-600">
              {siteConfig.description}
            </p>
          </div>

          {/* Quick Links */}
          <div>
            <h3 className="text-sm font-semibold leading-6 text-slate-900">Company</h3>
            <ul role="list" className="mt-6 space-y-4">
              {siteConfig.mainNav.map((item) => (
                <li key={item.title}>
                  <Link href={item.href} className="text-sm leading-6 text-slate-600 hover:text-slate-900">
                    {item.title}
                  </Link>
                </li>
              ))}
            </ul>
          </div>

          {/* Services */}
          <div>
            <h3 className="text-sm font-semibold leading-6 text-slate-900">Services</h3>
            <ul role="list" className="mt-6 space-y-4">
              {services.slice(0, 5).map((service) => (
                <li key={service.id}>
                  <Link href={`/services/${service.slug}`} className="text-sm leading-6 text-slate-600 hover:text-slate-900">
                    {service.title}
                  </Link>
                </li>
              ))}
            </ul>
          </div>

          {/* Contact */}
          <div>
            <h3 className="text-sm font-semibold leading-6 text-slate-900">Contact Us</h3>
            <ul role="list" className="mt-6 space-y-4 text-sm leading-6 text-slate-600">
              <li className="flex items-start">
                <MapPin className="h-5 w-5 mr-3 text-slate-400 shrink-0 mt-0.5" />
                <span>{siteConfig.contact.address}</span>
              </li>
              <li className="flex items-center">
                <Phone className="h-5 w-5 mr-3 text-slate-400 shrink-0" />
                <span>{siteConfig.contact.phone}</span>
              </li>
              <li className="flex items-center">
                <Mail className="h-5 w-5 mr-3 text-slate-400 shrink-0" />
                <span>{siteConfig.contact.email}</span>
              </li>
            </ul>
          </div>
        </div>
        
        <div className="mt-16 border-t border-slate-200 pt-8 sm:mt-20 lg:mt-24">
          <p className="text-xs leading-5 text-slate-500">
            &copy; {new Date().getFullYear()} {siteConfig.name}. All rights reserved.
          </p>
        </div>
      </div>
    </footer>
  );
}
