export function LandingProductHunt() {
  return (
    <section className="max-w-3xl mx-auto px-6 py-16">
      <div className="rounded-2xl border border-border/60 bg-card/60 backdrop-blur-sm p-8 sm:p-10 space-y-5 text-center">
        <p className="text-xs font-bold tracking-widest uppercase text-muted-foreground">Embed Your Launch</p>
        <h3 className="text-2xl sm:text-3xl font-bold font-nunito">
          Orbis — AI Product Research &amp; Validation
        </h3>
        <p className="text-muted-foreground max-w-md mx-auto">
          Stop guessing. Start validating product ideas.
        </p>
        <a
          href="https://www.producthunt.com/posts/orbis"
          target="_blank"
          rel="noopener noreferrer"
          className="inline-flex items-center gap-2 rounded-full bg-[#ff6154] hover:bg-[#e5564a] text-white font-semibold px-6 py-3 text-sm transition-all hover:-translate-y-0.5 shadow-lg"
        >
          Check it out on Product Hunt →
        </a>
        <p className="text-xs text-muted-foreground pt-2">
          Share this with your press contacts, partners, or embed it in blog posts.
        </p>
      </div>
    </section>
  );
}
