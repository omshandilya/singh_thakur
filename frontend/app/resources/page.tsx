import { Input } from "../../components/ui/input";
import { Button } from "../../components/ui/button";
import { Search } from "lucide-react";

// Placeholder data for Phase 1
const categories = ["All", "Tax Updates", "Compliance", "Audit Insights", "Firm News"];
const resources = [
  { id: 1, title: "Understanding the New Income Tax Slab Rates for FY 2026-27", category: "Tax Updates", date: "Sep 01, 2026", excerpt: "A comprehensive breakdown of the recent changes in the union budget regarding personal taxation." },
  { id: 2, title: "Ultimate Guide to GST Annual Return Filing (GSTR-9)", category: "Compliance", date: "Aug 15, 2026", excerpt: "Everything you need to know to accurately file your GSTR-9 before the upcoming deadline." },
  { id: 3, title: "Top 5 Internal Controls Every SME Should Implement", category: "Audit Insights", date: "Jul 22, 2026", excerpt: "Protect your assets and ensure reliable financial reporting with these essential internal control measures." },
  { id: 4, title: "Navigating FEMA Regulations for Foreign Direct Investment", category: "Compliance", date: "Jun 10, 2026", excerpt: "Key compliance requirements for Indian companies receiving FDI." },
];

export default function ResourcesPage() {
  return (
    <div className="py-20 bg-slate-50 min-h-screen">
      <div className="container mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
        
        <div className="flex flex-col md:flex-row md:items-end justify-between mb-12 gap-6">
          <div>
            <h1 className="text-4xl font-bold text-slate-900 mb-4">Insights & Resources</h1>
            <p className="text-lg text-slate-600 max-w-2xl">
              Stay updated with the latest financial regulations, tax laws, and business insights from our experts.
            </p>
          </div>
          
          <div className="relative w-full md:w-80">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400" />
            <Input placeholder="Search resources..." className="pl-10 bg-white" />
          </div>
        </div>

        {/* Categories */}
        <div className="flex flex-wrap gap-2 mb-12">
          {categories.map((cat, idx) => (
            <button 
              key={idx}
              className={`px-4 py-2 rounded-full text-sm font-medium transition-colors ${
                idx === 0 
                  ? 'bg-slate-900 text-white' 
                  : 'bg-white border border-slate-200 text-slate-600 hover:border-slate-300 hover:bg-slate-50'
              }`}
            >
              {cat}
            </button>
          ))}
        </div>

        {/* Resource Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-8 mb-16">
          {resources.map((resource) => (
            <div key={resource.id} className="bg-white border border-slate-200 rounded-2xl p-8 hover:shadow-md transition-shadow flex flex-col h-full">
              <div className="flex items-center justify-between mb-4">
                <span className="inline-flex items-center rounded-full bg-slate-100 px-2.5 py-0.5 text-xs font-medium text-slate-800">
                  {resource.category}
                </span>
                <span className="text-sm text-slate-500">{resource.date}</span>
              </div>
              <h3 className="text-xl font-bold text-slate-900 mb-3 hover:text-slate-700 cursor-pointer transition-colors">
                {resource.title}
              </h3>
              <p className="text-slate-600 mb-6 flex-grow">
                {resource.excerpt}
              </p>
              <div className="mt-auto pt-6 border-t border-slate-100">
                <span className="text-sm font-semibold text-slate-900 hover:underline cursor-pointer">
                  Read Article &rarr;
                </span>
              </div>
            </div>
          ))}
        </div>

        {/* Pagination Placeholder */}
        <div className="flex justify-center">
          <div className="flex items-center gap-2">
            <Button variant="outline" disabled className="w-10 p-0 text-slate-400">&larr;</Button>
            <Button variant="outline" className="w-10 p-0 bg-slate-100 text-slate-900">1</Button>
            <Button variant="outline" className="w-10 p-0 text-slate-600">2</Button>
            <Button variant="outline" className="w-10 p-0 text-slate-600">3</Button>
            <Button variant="outline" className="w-10 p-0 text-slate-600">&rarr;</Button>
          </div>
        </div>

      </div>
    </div>
  );
}
