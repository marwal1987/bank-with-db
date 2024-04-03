import Link from "next/link";

export default function Header() {
  return (
    
    
    <header className="header">
      <div
        aria-hidden="true"
        className="p-3 text-xl font-bold uppercase drop-shadow-xl border border-zinc-400 bg-gradient-to-tl from-emerald-800 to-emerald-800 via-emerald-500 via-70% rounded-md shadow-sm"
      >
       <span className="bg-clip-text text-transparent bg-gradient-to-tl from-slate-300 to-slate-200 via-slate-100">
         DinBank
        </span>
      </div>

      <nav>
        <menu className="nav-menu">
          <Link href="/" className="link">
            Hem
          </Link>
          <Link href="/create-user" className="link">
            Skapa användare
          </Link>

          <Link href="/login" className="link">
            Logga in
          </Link>
          <Link href="/account" className="link">
            Konto
          </Link>
        </menu>
      </nav>
    </header>
  );
}
