import { Link } from "react-router-dom";

// This screen doubles as both the marketing landing page AND the first
// "how do you want to sign in?" step. It matches the reference design:
// a dark green panel on the left (branding + pitch) and a white panel on
// the right (the actual sign-in choice).
export default function Landing() {
  return (
    <div className="min-h-screen w-full flex flex-col lg:flex-row font-body-md">
      {/* Left: dark green hero panel */}
      <div className="lg:w-1/2 w-full bg-gradient-to-br from-brand-ink to-brand-ink-light text-white flex flex-col justify-between px-8 py-10 lg:px-16 lg:py-16 min-h-[420px] lg:min-h-screen">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-full bg-white/10 flex items-center justify-center">
            <span className="material-symbols-outlined">storefront</span>
          </div>
          <span className="font-headline-md text-headline-md">KaliPOS</span>
        </div>

        <div className="max-w-lg my-12 lg:my-0">
          <h1 className="font-display-lg text-[40px] lg:text-[52px] leading-[1.05] font-bold tracking-tight mb-6">
            The retail operating system <span className="text-brand-green-light">built for Africa.</span>
          </h1>
          <p className="text-white/70 text-body-lg leading-relaxed mb-10">
            Sell faster, track stock, accept M-Pesa, and run your shop from your phone — powered by AI.
          </p>

          <div className="flex flex-col gap-5">
            <FeatureLine icon="auto_awesome" text="AI insights tuned for Kenyan retail" />
            <FeatureLine icon="smartphone" text="Mobile-first, works on any Android" />
            <FeatureLine icon="shield" text="Multi-tenant, secure by default" />
          </div>
        </div>

        <p className="text-white/50 text-label-sm">Trusted by 1,200+ shops across Kenya 🇰🇪</p>
      </div>

      {/* Right: sign-in choice */}
      <div className="lg:w-1/2 w-full bg-white flex items-center justify-center px-8 py-16 lg:px-16">
        <div className="w-full max-w-sm">
          <h2 className="font-display-lg text-[32px] font-bold text-on-surface mb-2 flex items-center gap-2">
            Karibu <span>👋</span>
          </h2>
          <p className="text-on-surface-variant text-body-md mb-8">How do you sign in?</p>

          <div className="flex flex-col gap-4">
            <Link
              to="/login/owner"
              className="w-full h-16 rounded-2xl bg-brand-green hover:bg-brand-green/90 text-white font-label-sm text-body-md flex items-center gap-3 px-6 transition-colors shadow-sm"
            >
              <span className="material-symbols-outlined">mail</span>
              Owner / Manager · Email login
            </Link>
            <Link
              to="/login/staff"
              className="w-full h-16 rounded-2xl bg-surface-container-low hover:bg-surface-container text-on-surface font-label-sm text-body-md flex items-center gap-3 px-6 transition-colors"
            >
              <span className="material-symbols-outlined">key</span>
              Staff · Phone + PIN
            </Link>
          </div>

          <p className="text-center text-on-surface-variant text-label-sm mt-10">
            New restaurant?{" "}
            <Link to="/login/owner?mode=signup" className="text-brand-green font-semibold hover:underline">
              Create an account
            </Link>
          </p>
        </div>
      </div>
    </div>
  );
}

function FeatureLine({ icon, text }) {
  return (
    <div className="flex items-center gap-3">
      <div className="w-8 h-8 rounded-full bg-white/10 flex items-center justify-center flex-shrink-0">
        <span className="material-symbols-outlined text-[18px]">{icon}</span>
      </div>
      <span className="text-white/85 text-body-md">{text}</span>
    </div>
  );
}
