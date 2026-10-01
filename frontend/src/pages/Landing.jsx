import Navbar from "../components/landing/Navbar"
import Hero from "../components/landing/Hero"
import CreditFooter from "../components/shared/CreditFooter"

const LandingPage = () => {
  return (
    <div className="landing-bg min-h-screen text-ink flex flex-col">
      <Navbar/>
      <div className="flex-1"><Hero/></div>
      <CreditFooter/>
    </div>
  )
}

export default LandingPage;
