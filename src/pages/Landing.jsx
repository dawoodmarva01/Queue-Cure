import { SiteFooter, SiteHeader } from '../components/SiteChrome.jsx'
import { Hero, TrustedBy } from '../components/Hero.jsx'
import { Features, ForClinics, HowItWorks } from '../components/ProductSections.jsx'
import { Faq, FinalCta, Onboarding, Pricing } from '../components/MoreSections.jsx'

export default function Landing() {
  return (
    <div className="qc-root min-h-screen">
      <SiteHeader />
      <main>
        <Hero />
        <TrustedBy />
        <ForClinics />
        <HowItWorks />
        <Features />
        <Onboarding />
        <Pricing />
        <Faq />
        <FinalCta />
      </main>
      <SiteFooter />
    </div>
  )
}
