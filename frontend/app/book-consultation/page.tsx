import { services } from "../../data/services";
import { Button } from "../../components/ui/button";
import { Input } from "../../components/ui/input";
import { Textarea } from "../../components/ui/textarea";

export default function BookConsultationPage() {
  return (
    <div className="py-20 bg-slate-50 min-h-screen">
      <div className="container mx-auto max-w-3xl px-4 sm:px-6 lg:px-8">
        <div className="text-center mb-12">
          <h1 className="text-4xl font-bold text-slate-900 mb-4">Book a Consultation</h1>
          <p className="text-lg text-slate-600">
            Schedule a confidential discussion with our partners to explore how we can assist you.
          </p>
        </div>

        <div className="bg-white p-8 md:p-12 rounded-2xl border border-slate-200 shadow-sm">
          <form className="space-y-8">
            {/* Personal Details */}
            <div>
              <h3 className="text-lg font-semibold text-slate-900 mb-4 border-b pb-2">1. Your Details</h3>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div className="space-y-2">
                  <label htmlFor="name" className="text-sm font-medium text-slate-900">Full Name</label>
                  <Input id="name" placeholder="John Doe" />
                </div>
                <div className="space-y-2">
                  <label htmlFor="company" className="text-sm font-medium text-slate-900">Company Name (Optional)</label>
                  <Input id="company" placeholder="Acme Corp" />
                </div>
                <div className="space-y-2">
                  <label htmlFor="email" className="text-sm font-medium text-slate-900">Email</label>
                  <Input id="email" type="email" placeholder="john@example.com" />
                </div>
                <div className="space-y-2">
                  <label htmlFor="phone" className="text-sm font-medium text-slate-900">Phone</label>
                  <Input id="phone" type="tel" placeholder="+91 98765 43210" />
                </div>
              </div>
            </div>

            {/* Service & Schedule */}
            <div>
              <h3 className="text-lg font-semibold text-slate-900 mb-4 border-b pb-2">2. Consultation Details</h3>
              <div className="space-y-6">
                <div className="space-y-2">
                  <label htmlFor="service" className="text-sm font-medium text-slate-900">Service Interested In</label>
                  <select id="service" className="flex h-10 w-full rounded-md border border-slate-300 bg-white px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-slate-900">
                    <option value="" disabled selected>Select a service...</option>
                    {services.map(s => (
                      <option key={s.id} value={s.id}>{s.title}</option>
                    ))}
                  </select>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div className="space-y-2">
                    <label htmlFor="date" className="text-sm font-medium text-slate-900">Preferred Date</label>
                    <Input id="date" type="date" />
                  </div>
                  <div className="space-y-2">
                    <label htmlFor="time" className="text-sm font-medium text-slate-900">Preferred Time</label>
                    <Input id="time" type="time" />
                  </div>
                </div>

                <div className="space-y-2">
                  <label htmlFor="notes" className="text-sm font-medium text-slate-900">Brief Overview of Requirements</label>
                  <Textarea id="notes" placeholder="Please provide some context so we can prepare for our meeting." className="min-h-[100px]" />
                </div>
              </div>
            </div>

            <Button type="button" className="w-full bg-slate-900 hover:bg-slate-800 text-white h-12 text-lg font-semibold">
              Request Appointment
            </Button>
            <p className="text-xs text-slate-500 text-center mt-4">
              Your information is strictly confidential. We will confirm your appointment via email or phone within 24 hours.
            </p>
          </form>
        </div>
      </div>
    </div>
  );
}
