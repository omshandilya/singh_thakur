import { teamMembers } from "../../data/team";

export default function TeamPage() {
  return (
    <div className="py-20 bg-slate-50 min-h-screen">
      <div className="container mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
        <div className="text-center mb-16">
          <h1 className="text-4xl font-bold text-slate-900 mb-4">Our Leadership</h1>
          <p className="text-lg text-slate-600 max-w-2xl mx-auto">
            Meet the experienced professionals guiding our firm and delivering excellence to our clients.
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
          {teamMembers.map((member) => (
            <div key={member.id} className="bg-white border border-slate-200 rounded-2xl overflow-hidden hover:shadow-lg transition-shadow">
              <div className="aspect-[4/3] bg-slate-200 relative flex items-center justify-center">
                 <span className="text-slate-500 font-medium">[{member.name} Photo]</span>
              </div>
              <div className="p-8">
                <h3 className="text-xl font-bold text-slate-900">{member.name}</h3>
                <p className="text-sm font-medium text-slate-500 mb-4">{member.designation}</p>
                <div className="flex flex-wrap gap-2 mb-4">
                  {member.qualifications.map((qual, idx) => (
                    <span key={idx} className="inline-flex items-center rounded-md bg-slate-100 px-2 py-1 text-xs font-medium text-slate-600">
                      {qual}
                    </span>
                  ))}
                </div>
                <p className="text-slate-600 text-sm leading-relaxed mb-6">
                  {member.shortBio}
                </p>
                <a href={member.linkedinUrl} className="text-sm font-semibold text-slate-900 hover:underline">
                  LinkedIn Profile &rarr;
                </a>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
