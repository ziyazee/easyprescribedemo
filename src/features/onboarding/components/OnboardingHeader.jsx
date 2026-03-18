export function OnboardingHeader() {
  return (
    <header className="w-full bg-white border-b border-[#dde4e2] sticky top-0 z-50">
      <div className="max-w-[1280px] mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between h-16">
          <div className="flex items-center gap-3">
            <div className="h-10 w-10 rounded-full overflow-hidden border-2 border-slate-200 shadow-sm flex-shrink-0">
              <img src="/img.png" alt="EasyPrescribe Logo" className="h-full w-full object-cover" />
            </div>
            <div className="flex flex-col min-w-0">
              <span className="text-lg font-bold text-[#121715] leading-tight">Easy Prescribe</span>
              <span className="text-[10px] text-[#67837a] leading-tight">simplifying clinical workflows</span>
            </div>
          </div>

          <div className="flex items-center gap-4">
            <div className="hidden md:flex flex-col items-end">
              <span className="text-sm font-medium text-[#121715]">Dr. Registration</span>
              <span className="text-xs text-[#67837a]">New Profile</span>
            </div>
            <div className="h-10 w-10 rounded-full bg-[#dde4e2] overflow-hidden">
              <img
                alt="User Avatar"
                className="h-full w-full object-cover"
                src="https://lh3.googleusercontent.com/aida-public/AB6AXuDl3PgbqGBdoSUZ7P8opWUgsEWDxWeSyDLo_eQgaZ1l_fMLiC4_z2SltY-uUtr2It7BMBktQZgLN5c9p1eQHrGXZvBvSsPKO7L5l2ct7wmMOZOS0_MYVrpcoF0WMhS4drU0Hkb84LQ7M1kjC5oD6AFTYi8WmIMFNgP-UpZgqz8HaL9lofpEXsW060n5Rofrf_S-QaqBBcl3Spq9IF_cuLp2kU7GqaGCnrT3cPCrVeh61Qs6TwJZlcXjKMlilG4I22zjH5H8UrJDrWyh"
              />
            </div>
          </div>
        </div>
      </div>
    </header>
  );
}
