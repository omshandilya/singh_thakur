import { siteConfig } from "../../config/site";
import { Button } from "../../components/ui/button";
import { Input } from "../../components/ui/input";
import { Textarea } from "../../components/ui/textarea";
import { Mail, Phone, MapPin, Clock } from "lucide-react";

export default function ContactPage() {
  return (
    <div className="py-20 bg-white min-h-screen">
      <div className="container mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-16">
          
          {/* Contact Information */}
          <div>
            <h1 className="text-4xl font-bold text-slate-900 mb-6">Contact Us</h1>
            <p className="text-lg text-slate-600 mb-12">
              Reach out to us for any inquiries, advisory needs, or to schedule an appointment. We are here to assist you.
            </p>

            <div className="space-y-8">
              <div className="flex items-start">
                <MapPin className="h-6 w-6 text-slate-900 mt-1 mr-4 shrink-0" />
                <div>
                  <h3 className="font-semibold text-slate-900">Our Office</h3>
                  <p className="text-slate-600 mt-1">{siteConfig.contact.address}</p>
                </div>
              </div>

              <div className="flex items-start">
                <Phone className="h-6 w-6 text-slate-900 mt-1 mr-4 shrink-0" />
                <div>
                  <h3 className="font-semibold text-slate-900">Phone</h3>
                  <p className="text-slate-600 mt-1">{siteConfig.contact.phone}</p>
                </div>
              </div>

              <div className="flex items-start">
                <Mail className="h-6 w-6 text-slate-900 mt-1 mr-4 shrink-0" />
                <div>
                  <h3 className="font-semibold text-slate-900">Email</h3>
                  <p className="text-slate-600 mt-1">{siteConfig.contact.email}</p>
                </div>
              </div>

              <div className="flex items-start">
                <Clock className="h-6 w-6 text-slate-900 mt-1 mr-4 shrink-0" />
                <div>
                  <h3 className="font-semibold text-slate-900">Business Hours</h3>
                  <p className="text-slate-600 mt-1">{siteConfig.contact.hours}</p>
                </div>
              </div>
            </div>

            <div className="mt-12 h-64 bg-slate-100 rounded-xl flex items-center justify-center border border-slate-200">
              <span className="text-slate-500 font-medium">[Google Maps Placeholder]</span>
            </div>
          </div>

          {/* Contact Form */}
          <div className="bg-slate-50 p-8 md:p-10 rounded-2xl border border-slate-200">
            <h2 className="text-2xl font-semibold text-slate-900 mb-8">Send us a message</h2>
            <form className="space-y-6">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div className="space-y-2">
                  <label htmlFor="firstName" className="text-sm font-medium text-slate-900">First Name</label>
                  <Input id="firstName" placeholder="John" />
                </div>
                <div className="space-y-2">
                  <label htmlFor="lastName" className="text-sm font-medium text-slate-900">Last Name</label>
                  <Input id="lastName" placeholder="Doe" />
                </div>
              </div>
              
              <div className="space-y-2">
                <label htmlFor="email" className="text-sm font-medium text-slate-900">Email Address</label>
                <Input id="email" type="email" placeholder="john@example.com" />
              </div>
              
              <div className="space-y-2">
                <label htmlFor="phone" className="text-sm font-medium text-slate-900">Phone Number</label>
                <Input id="phone" type="tel" placeholder="+91 98765 43210" />
              </div>

              <div className="space-y-2">
                <label htmlFor="message" className="text-sm font-medium text-slate-900">Message</label>
                <Textarea id="message" placeholder="How can we help you?" className="min-h-[150px]" />
              </div>

              <Button type="button" className="w-full bg-slate-900 hover:bg-slate-800 text-white h-12 text-base">
                Send Message
              </Button>
            </form>
          </div>

        </div>
      </div>
    </div>
  );
}
