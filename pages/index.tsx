import Link from 'next/link';
import Image from 'next/image';

export default function LandingPage() {
  return (
    <div className="min-h-screen flex">
      {/* Left Sidebar - Dark Green */}
      <div className="w-full md:w-1/3 lg:w-1/4 bg-[#2683EB] text-white p-8 flex flex-col justify-between min-h-screen md:sticky md:top-0 md:h-screen md:overflow-y-auto">
        {/* Top Section */}
        <div>
          {/* Logo and Get Started Button */}
          <div className="flex justify-between items-center mb-12">
            <div className="flex items-center space-x-2">
              <Image 
                src="/logos.png" 
                alt="QuickRepp Logo" 
                width={64} 
                height={64}
                className="rounded-lg"
              />
              <h1 className="text-2xl font-bold">
                Quick<span className="text-orange-400">Repp</span>
              </h1>
            </div>
            <Link href="/login">
              <button className="bg-orange-400 text-white px-4 py-2 rounded-lg font-medium hover:bg-orange-500 transition-colors">
                Get started
              </button>
            </Link>
          </div>

          {/* Hero Text */}
          <div className="mb-12">
            <h2 className="mb-4" style={{ 
              fontFamily: "'Source Serif Pro', serif",
              fontSize: '80px',
              fontWeight: 400,
              lineHeight: '100%',
              letterSpacing: '-0.04em'
            }}>
              Lottery Operations Made Simple
            </h2>
            <p className="text-lg text-white/90">
              No manual calculations or paper tracking. Streamline your daily lottery operations and reports with ease.
            </p>
          </div>

          {/* Our Offerings */}
          <div className="mb-8">
            <h3 className="text-white text-sm font-semibold mb-4">Our offerings</h3>
            <div className="space-y-3">
              <div className="bg-orange-400 rounded-lg p-4 flex items-center space-x-3">
                <svg className="w-6 h-6 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 10V3L4 14h7v7l9-11h-7z" />
                </svg>
                <span className="text-white font-medium">Instant Productivity</span>
              </div>
              <div className="bg-orange-400 rounded-lg p-4 flex items-center space-x-3">
                <svg className="w-6 h-6 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3.055 11H5a2 2 0 012 2v1a2 2 0 002 2 2 2 0 012 2v2.945M8 3.935V5.5A2.5 2.5 0 0010.5 8h.5a2 2 0 012 2 2 2 0 104 0 2 2 0 012-2h1.064M15 20.488V18a2 2 0 012-2h3.064M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                </svg>
                <span className="text-white font-medium">Expert Management</span>
              </div>
              <div className="bg-orange-400 rounded-lg p-4 flex items-center space-x-3">
                <svg className="w-6 h-6 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 0112 2.944a11.955 11.955 0 01-8.618 3.04A12.02 12.02 0 003 9c0 5.591 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.042-.133-2.052-.382-3.016z" />
                </svg>
                <span className="text-white font-medium">Advanced Technology</span>
              </div>
            </div>
          </div>
        </div>

        {/* Footer Links */}
        <div className="text-sm text-white/70 space-y-2">
          <div className="flex space-x-4">
            <a href="#" className="hover:text-white">Contact</a>
            {/* <a href="#" className="hover:text-white">Social</a>
            <a href="#" className="hover:text-white">Address</a>*/}
            <a href="#" className="hover:text-white">Legal Terms</a> 
          </div>
        </div>
      </div>

      {/* Right Content Area - White */}
      <div className="flex-1 bg-white overflow-y-auto">
        {/* Hero Image Section */}
        <div className="relative px-8 py-12">
          <div className="relative max-w-4xl mx-auto">
            <div className="rounded-lg h-96 flex items-center justify-center relative overflow-hidden">
              <Image 
                src="/clerk.png" 
                alt="Employee using QuickRepp" 
                fill
                className="object-cover"
                style={{ objectPosition: 'center 30%' }}
                priority
              />
              
              {/* Overlay Notifications */}
              <div className="absolute top-8 right-8 bg-[#BFDBFE] rounded-lg p-3 shadow-lg z-20">
                <div className="flex items-center space-x-2">
                  <svg className="w-5 h-5 text-[#2683EB]" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                  </svg>
                  <span className="text-[#2683EB] font-medium text-sm">Lottery Tickets Scanned!</span>
                </div>
              </div>
              <div className="absolute bottom-16 left-8 bg-[#BFDBFE] rounded-lg p-3 shadow-lg z-20">
                <div className="flex items-center space-x-2">
                  <svg className="w-5 h-5 text-[#2683EB]" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                  </svg>
                  <span className="text-[#2683EB] font-medium text-sm">Report Automated!</span>
                </div>
              </div>
              <div className="absolute bottom-8 right-16 bg-[#BFDBFE] rounded-lg p-3 shadow-lg z-20">
                <div className="flex items-center space-x-2">
                  <svg className="w-5 h-5 text-[#2683EB]" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                  </svg>
                  <span className="text-[#2683EB] font-medium text-sm">Cash Deposit Calculated!</span>
                </div>
              </div>
            </div>
          </div>
          
          <p className="text-[#2683EB] text-xl font-medium mt-6 text-center max-w-4xl mx-auto">
            We escalate transfer efficiency and productivity
          </p>

          {/* Partner Logos */}
          <div className="flex justify-center items-center space-x-8 mt-8 flex-wrap gap-8">
            <div className="h-16 w-auto flex items-center">
              <Image 
                src="/malottery.png" 
                alt="Massachusetts Lottery" 
                width={160}
                height={64}
                className="object-contain h-full"
              />
            </div>
            <div className="h-16 w-auto flex items-center">
              <Image 
                src="/nrspaylogo.png" 
                alt="NRS Pay" 
                width={160}
                height={64}
                className="object-contain h-full"
              />
            </div>
            <div className="h-16 w-auto flex items-center">
              <Image 
                src="/clover-logo-black.png" 
                alt="Clover" 
                width={160}
                height={64}
                className="object-contain h-full"
              />
            </div>
          </div>
        </div>

        {/* Get More Done Section */}
        <div className="px-8 py-12 bg-white">
          <div className="max-w-4xl mx-auto">
            <h2 className="text-3xl text-[#2683EB] mb-4 text-center" style={{ 
              fontFamily: "'Source Serif Pro', serif",
              fontWeight: 600
            }}>Get More Done In A Week</h2>
            <p className="text-gray-600 mb-8 text-lg">
              Maximize your productivity with our intuitive tools designed to streamline your workflow. From ticket tracking to report management, stay organized.
            </p>
            
            <div className="grid grid-cols-2 gap-4">
              <div className="bg-[#BFDBFE] rounded-lg p-6">
                <div className="text-5xl font-bold text-[#2683EB] mb-2">2x</div>
                <p className="text-[#2683EB] font-medium">Double Your Productivity</p>
              </div>
              <div className="bg-[#BFDBFE] rounded-lg p-6">
                <div className="mb-3">
                  <svg className="w-12 h-12 text-[#2683EB]" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" />
                  </svg>
                </div>
                <p className="text-[#2683EB] font-medium">Efficiency Increase Per Report</p>
              </div>
              <div className="bg-[#BFDBFE] rounded-lg p-6">
                <div className="mb-3">
                  <svg className="w-12 h-12 text-[#2683EB]" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7h12m0 0l-4-4m4 4l-4 4m0 6H4m0 0l4 4m-4-4l4-4" />
                  </svg>
                </div>
                <p className="text-[#2683EB] font-medium">Centralize Your Operations</p>
              </div>
              <div className="bg-[#BFDBFE] rounded-lg p-6">
                <div className="text-5xl font-bold text-[#2683EB] mb-2">130%</div>
                <p className="text-[#2683EB] font-medium">More Activity</p>
              </div>
            </div>
          </div>
        </div>

        {/* The Most Reliable App Section */}
        <div className="px-8 py-12 bg-white">
          <div className="max-w-4xl mx-auto">
            <h2 className="text-3xl text-[#2683EB] mb-8 text-center" style={{ 
              fontFamily: "'Source Serif Pro', serif",
              fontWeight: 600
            }}>The Most Reliable App</h2>
            
            <div className="grid md:grid-cols-2 gap-8">
              <div>
                <div className="rounded-lg mb-4 h-48 relative overflow-hidden">
                  <Image 
                    src="/clerks.png" 
                    alt="Team using QuickRepp" 
                    fill
                    className="object-cover"
                  />
                </div>
                <h3 className="text-xl font-bold text-[#2683EB] mb-2">Scale Your Team, Not Your Expenses</h3>
                <p className="text-gray-600">Issue reports and track tickets at no additional cost to support teams of any size.</p>
              </div>
              
              <div>
                <div className="rounded-lg mb-4 h-48 relative overflow-hidden border-2 border-dashed border-gray-300">
                  <Image 
                    src="/lottery.png" 
                    alt="Lottery tickets" 
                    fill
                    className="object-cover"
                  />
                </div>
                <h3 className="text-xl font-bold text-[#2683EB] mb-2">Effortless Paper Tracking</h3>
                <p className="text-gray-600">Get precise and fast scanning of your documents. Easily capture, store, and retrieve any type of paper.</p>
              </div>
            </div>
          </div>
        </div>

        {/* First Class Software Section */}
        <div className="px-8 py-12 bg-white">
          <div className="max-w-4xl mx-auto">
            <h2 className="text-3xl text-[#2683EB] mb-4 text-center" style={{ 
              fontFamily: "'Source Serif Pro', serif",
              fontWeight: 600
            }}>First Class Software</h2>
            <p className="text-gray-600 mb-8 text-lg">
              Get real-time insights, boundless integrations, and sophisticated tools to manage it all with 100% efficiency.
            </p>
            
            <div className="grid grid-cols-2 gap-4">
              <div className="bg-[#2683EB] rounded-lg p-6 text-white">
                <svg className="w-8 h-8 mb-3 text-orange-300" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 10h18M7 15h1m4 0h1m-7 4h12a3 3 0 003-3V8a3 3 0 00-3-3H6a3 3 0 00-3 3v8a3 3 0 003 3z" />
                </svg>
                <p className="font-medium">Safe Storage</p>
              </div>
              <div className="bg-[#2683EB] rounded-lg p-6 text-white">
                <svg className="w-8 h-8 mb-3 text-orange-300" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 15l-2 5L9 9l11 4-5 2zm0 0l5 5M7.188 2.239l.777 2.897M5.136 7.965l-2.898-.719M13.95 4.05l-2.122 2.122m-5.657 5.656l-2.12 2.122" />
                </svg>
                <p className="font-medium">One Click</p>
              </div>
              <div className="bg-[#2683EB] rounded-lg p-6 text-white">
                <svg className="w-8 h-8 mb-3 text-orange-300" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" />
                </svg>
                <p className="font-medium">Easy Stats</p>
              </div>
              <div className="bg-[#2683EB] rounded-lg p-6 text-white">
                <svg className="w-8 h-8 mb-3 text-orange-300" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0zm6 3a2 2 0 11-4 0 2 2 0 014 0zM7 10a2 2 0 11-4 0 2 2 0 014 0z" />
                </svg>
                <p className="font-medium">Team Plans</p>
              </div>
            </div>
          </div>
        </div>

        {/* Call to Action Section */}
        <div className="relative px-8 py-16">
          <div className="bg-gradient-to-r from-[#A8D3FF] to-[#FFF4DF] rounded-lg h-64 flex items-center justify-center relative overflow-hidden">
            <div className="relative z-10 text-center px-8">
              <p className="text-gray-800 text-2xl font-bold mb-6">Sign in to your account to start using QuickRepp.</p>
              <Link href="/login">
                <button className="bg-[#2683EB] text-white px-8 py-3 rounded-lg font-semibold hover:bg-[#1a6fd4] transition-colors">
                  Sign In
                </button>
              </Link>
            </div>
          </div>
        </div>

        {/* Footer */}
        <footer className="bg-gray-50 px-8 py-12">
          <div className="max-w-4xl mx-auto flex flex-col md:flex-row justify-between items-start md:items-center">
            <div className="flex items-center space-x-2 mb-4 md:mb-0">
              <Image 
                src="/logos.png" 
                alt="QuickRepp Logo" 
                width={64} 
                height={64}
                className="rounded-lg"
              />
              <h3 className="text-2xl font-bold text-[#2683EB]">
                Quick<span className="text-orange-400">Repp</span>
              </h3>
            </div>
            <div className="text-sm text-gray-600 space-y-2">
              <div>
                <p className="font-semibold text-[#2683EB] mb-1">Contact</p>
                <p>info@quickrepp.com</p>
                {/* <div className="flex space-x-4 mt-2">
                  <a href="#" className="hover:text-[#2683EB]">Instagram</a>
                  <a href="#" className="hover:text-[#2683EB]">X</a>
                  <a href="#" className="hover:text-[#2683EB]">LinkedIn</a>
                </div> */}
              </div>
              <div className="flex space-x-4 mt-4">
                <a href="#" className="hover:text-[#2683EB]">Terms & Conditions</a>
                <a href="#" className="hover:text-[#2683EB]">Privacy</a>
              </div>
            </div>
          </div>
        </footer>
      </div>
    </div>
  );
}
