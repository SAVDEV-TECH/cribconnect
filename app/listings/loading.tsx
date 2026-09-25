// app/listings/loading.tsx — Listings page loading skeleton
export default function ListingsLoading() {
  return (
    <div className="min-h-screen bg-slate-50 animate-pulse">
      {/* Filter bar skeleton */}
      <div className="bg-white border-b border-slate-200 py-4 px-4 sm:px-6 lg:px-8">
        <div className="max-w-7xl mx-auto flex gap-3">
          {[...Array(5)].map((_, i) => (
            <div key={i} className="h-9 w-28 bg-slate-100 rounded-xl" />
          ))}
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="h-5 w-40 bg-slate-200 rounded mb-6" />
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {[...Array(9)].map((_, i) => (
            <div key={i} className="bg-white rounded-2xl border border-slate-100 overflow-hidden shadow-sm">
              <div className="h-52 bg-slate-200" />
              <div className="p-4 space-y-3">
                <div className="h-4 bg-slate-200 rounded w-4/5" />
                <div className="h-3 bg-slate-100 rounded w-1/2" />
                <div className="flex gap-2 mt-2">
                  <div className="h-6 w-20 bg-slate-100 rounded-full" />
                  <div className="h-6 w-16 bg-slate-100 rounded-full" />
                </div>
                <div className="h-5 bg-slate-200 rounded w-1/3 mt-3" />
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
