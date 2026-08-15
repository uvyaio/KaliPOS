import { Link } from "react-router-dom";

export default function Landing() {
  return (
    <div className="bg-surface font-body-md text-on-surface">
      <header className="fixed top-0 w-full z-50 bg-surface/80 backdrop-blur-xl shadow-[0_1px_8px_rgba(0,0,0,0.04)]">
        <div className="h-16 w-full px-container-padding flex items-center justify-between">
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 rounded bg-primary flex items-center justify-center">
              <span className="material-symbols-outlined text-on-primary text-[20px]">restaurant_menu</span>
            </div>
            <span className="font-headline-md text-headline-md tracking-tight text-primary">KaliPOS</span>
          </div>
          <nav className="hidden md:flex items-center gap-8">
            <a className="transition-colors text-primary font-semibold" href="#features">Features</a>
            <a className="font-label-sm text-label-sm text-on-surface-variant hover:text-on-surface transition-colors" href="#pricing">Pricing</a>
            <a className="font-label-sm text-label-sm text-on-surface-variant hover:text-on-surface transition-colors" href="#support">Support</a>
          </nav>
          <div className="flex items-center gap-4">
            <Link className="font-label-sm text-label-sm text-primary px-4 py-2 rounded-lg hover:bg-secondary-container transition-all" to="/login/owner">
              Terminal Login
            </Link>
            <div className="w-8 h-8 rounded-full bg-primary flex items-center justify-center">
              <span className="material-symbols-outlined text-on-primary text-[18px]">person</span>
            </div>
          </div>
        </div>
      </header>

      <main className="w-full pt-16">
        <div className="flex flex-col w-full">
          <div className="flex flex-col lg:flex-row w-full min-h-[calc(100vh-64px)]">
            {/* Left: brand pitch */}
            <div className="w-full lg:w-1/2 bg-on-surface text-on-primary flex flex-col justify-center px-8 py-16 lg:px-16 xl:px-24 relative overflow-hidden">
              <div className="relative z-10 flex flex-col gap-12 max-w-lg mx-auto lg:mx-0">
                <div className="flex flex-col gap-4">
                  <h1 className="font-display-lg text-display-lg text-on-primary leading-tight">
                    The retail operating system built for Africa.
                  </h1>
                  <p className="font-body-lg text-body-lg text-on-primary/80 max-w-md">
                    KaliPOS brings high-efficiency density and organic reliability to modern restaurant management.
                  </p>
                </div>
                <div className="flex flex-col gap-8">
                  {[
                    { icon: "auto_awesome", title: "AI insights tuned for Kenyan retail", body: "Automated stock predictions and localized consumer trend analysis." },
                    { icon: "smartphone", title: "Mobile-first", body: "Optimized touch-targets for on-the-go management and point-of-sale." },
                    { icon: "shield_lock", title: "Secure by default", body: "Enterprise-grade encryption and role-based access control." },
                  ].map((f) => (
                    <div className="flex gap-4" key={f.title}>
                      <div className="w-12 h-12 rounded-xl bg-primary/20 flex items-center justify-center shrink-0">
                        <span className="material-symbols-outlined text-inverse-primary text-[24px]">{f.icon}</span>
                      </div>
                      <div className="flex flex-col gap-1">
                        <h3 className="font-headline-md text-body-md font-bold text-on-primary">{f.title}</h3>
                        <p className="font-body-md text-label-sm text-on-primary/70">{f.body}</p>
                      </div>
                    </div>
                  ))}
                </div>
                <div className="mt-8 flex items-center gap-4 text-on-primary/60">
                  <span className="w-8 h-8 rounded bg-surface/10 flex items-center justify-center">
                    <span className="material-symbols-outlined text-[16px]">restaurant_menu</span>
                  </span>
                  <span className="font-label-sm text-label-sm tracking-widest uppercase">Trusted by 500+ locations</span>
                </div>
              </div>
            </div>

            {/* Right: login method picker */}
            <div className="w-full lg:w-1/2 bg-surface text-on-surface flex flex-col justify-center px-8 py-16 lg:px-16 xl:px-24">
              <div className="w-full max-w-md mx-auto">
                <div className="flex flex-col gap-2 mb-12 text-center lg:text-left">
                  <h2 className="font-display-lg text-headline-lg font-bold text-on-surface">Karibu 👋</h2>
                  <p className="font-body-md text-body-md text-on-surface-variant">Select your login method to access your workspace.</p>
                </div>
                <div className="flex flex-col gap-6">
                  <Link
                    to="/login/owner"
                    className="w-full group flex flex-col items-center justify-center gap-4 p-8 rounded-2xl bg-surface-container hover:bg-surface-container-high transition-colors text-center cursor-pointer border border-transparent hover:border-primary/20 focus:outline-none focus:ring-2 focus:ring-primary/50 shadow-sm hover:shadow-md relative overflow-hidden"
                  >
                    <div className="absolute top-0 right-0 w-32 h-32 bg-primary/5 rounded-full blur-2xl -mr-16 -mt-16 group-hover:bg-primary/10 transition-colors"></div>
                    <div className="w-16 h-16 rounded-full bg-primary flex items-center justify-center shadow-lg shadow-primary/20 mb-2">
                      <span className="material-symbols-outlined text-on-primary text-[32px]">admin_panel_settings</span>
                    </div>
                    <div className="flex flex-col gap-1">
                      <span className="font-headline-md text-headline-md text-on-surface">Owner / Manager</span>
                      <span className="font-body-md text-body-md text-on-surface-variant">Email login</span>
                    </div>
                    <div className="mt-4 px-6 py-2 rounded-lg bg-primary text-on-primary font-label-sm text-label-sm w-full max-w-[200px] transition-transform group-hover:scale-105">
                      Access Dashboard
                    </div>
                  </Link>
                  <Link
                    to="/login/staff"
                    className="w-full group flex flex-col items-center justify-center gap-4 p-8 rounded-2xl bg-secondary-container/30 hover:bg-secondary-container/50 transition-colors text-center cursor-pointer border border-transparent hover:border-secondary/20 focus:outline-none focus:ring-2 focus:ring-secondary/50"
                  >
                    <div className="w-16 h-16 rounded-full bg-surface flex items-center justify-center shadow-sm text-primary mb-2">
                      <span className="material-symbols-outlined text-[32px]">dialpad</span>
                    </div>
                    <div className="flex flex-col gap-1">
                      <span className="font-headline-md text-headline-md text-on-surface">Staff Terminal</span>
                      <span className="font-body-md text-body-md text-on-surface-variant">Phone + PIN</span>
                    </div>
                    <div className="mt-4 px-6 py-2 rounded-lg bg-surface text-primary font-label-sm text-label-sm w-full max-w-[200px] shadow-sm transition-transform group-hover:scale-105">
                      Open POS
                    </div>
                  </Link>
                </div>
                <div className="mt-16 pt-8 border-t border-surface-container-high text-center">
                  <p className="font-body-md text-body-md text-on-surface-variant">
                    New restaurant?
                    <Link className="font-label-sm text-primary hover:text-primary-container ml-2" to="/login/owner?mode=signup">
                      Create an account
                    </Link>
                  </p>
                </div>
              </div>
            </div>
          </div>
        </div>
      </main>

      <footer className="w-full bg-surface-container-low py-12 border-t border-outline-variant/30">
        <div className="max-w-7xl mx-auto px-container-padding flex flex-col md:flex-row justify-between items-center gap-8">
          <div className="flex items-center gap-2 grayscale opacity-70">
            <div className="w-6 h-6 rounded bg-on-surface flex items-center justify-center">
              <span className="material-symbols-outlined text-surface text-[14px]">restaurant_menu</span>
            </div>
            <span className="font-headline-md text-body-md font-bold text-on-surface">KaliPOS</span>
          </div>
          <div className="flex gap-6">
            <a className="text-on-surface-variant hover:text-primary font-label-sm text-label-sm" href="#">Privacy Policy</a>
            <a className="text-on-surface-variant hover:text-primary font-label-sm text-label-sm" href="#">Terms of Service</a>
            <a className="text-on-surface-variant hover:text-primary font-label-sm text-label-sm" href="#">Security</a>
          </div>
          <div className="font-body-md text-label-sm text-on-surface-variant">© 2026 KaliPOS Systems Inc.</div>
        </div>
      </footer>
    </div>
  );
}
