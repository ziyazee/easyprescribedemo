export function MedicalBackground({ children }) {
  return (
    <main className="medical-pattern-bg bg-background-light font-display antialiased min-h-screen flex flex-col items-center justify-center p-4 relative overflow-hidden">
      <div className="absolute -top-[10%] -left-[10%] w-[40%] h-[40%] bg-primary/5 rounded-full blur-3xl pointer-events-none" />
      <div className="absolute top-[20%] -right-[5%] w-[30%] h-[30%] bg-primary/5 rounded-full blur-3xl pointer-events-none" />
      <div className="w-full max-w-[480px] relative">{children}</div>
    </main>
  );
}
