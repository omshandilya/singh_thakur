import { siteConfig } from "../../config/site";

export default function AboutPage() {
  return (
    <div className="py-20 bg-white">
      <div className="container mx-auto max-w-4xl px-4 sm:px-6 lg:px-8">
        <h1 className="text-4xl font-bold text-slate-900 mb-8">About {siteConfig.name}</h1>
        
        <div className="prose prose-slate max-w-none">
          <p className="text-lg text-slate-600 leading-relaxed mb-8">
            {siteConfig.name} is a premier Chartered Accountancy firm committed to delivering comprehensive financial, taxation, and advisory services. With decades of combined experience, our partners bring deep industry knowledge and technical excellence to every client engagement.
          </p>

          <div className="my-12 bg-slate-50 p-8 rounded-2xl border border-slate-100">
            <h2 className="text-2xl font-semibold text-slate-900 mb-4">Our Mission</h2>
            <p className="text-slate-600 mb-8">
              To provide highest quality professional services that create value for our clients, adhering strictly to the principles of integrity, transparency, and accountability.
            </p>

            <h2 className="text-2xl font-semibold text-slate-900 mb-4">Our Vision</h2>
            <p className="text-slate-600">
              To be the most trusted and respected professional services firm, recognized for our client-centric approach, innovative solutions, and unwavering commitment to excellence.
            </p>
          </div>

          <h2 className="text-2xl font-semibold text-slate-900 mb-6">Our Values</h2>
          <ul className="space-y-4 text-slate-600">
            <li className="flex items-start">
              <span className="h-6 w-6 rounded bg-slate-900 text-white flex items-center justify-center text-sm font-bold mr-3 mt-0.5 shrink-0">1</span>
              <span><strong>Integrity:</strong> We uphold the highest ethical standards in all our dealings.</span>
            </li>
            <li className="flex items-start">
              <span className="h-6 w-6 rounded bg-slate-900 text-white flex items-center justify-center text-sm font-bold mr-3 mt-0.5 shrink-0">2</span>
              <span><strong>Excellence:</strong> We are committed to continuous learning and delivering superior results.</span>
            </li>
            <li className="flex items-start">
              <span className="h-6 w-6 rounded bg-slate-900 text-white flex items-center justify-center text-sm font-bold mr-3 mt-0.5 shrink-0">3</span>
              <span><strong>Client Focus:</strong> Your success is our success. We tailor our services to meet your specific needs.</span>
            </li>
          </ul>
        </div>
      </div>
    </div>
  );
}
