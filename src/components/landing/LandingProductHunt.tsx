export function LandingProductHunt() {
  return (
    <section className="max-w-3xl mx-auto px-6 py-16">
      <div className="text-center mb-6">
        <p className="text-xs font-bold tracking-widest uppercase text-muted-foreground">Embed Your Launch</p>
      </div>
      <div className="max-w-[500px] mx-auto rounded-xl border border-border bg-card p-5 shadow-sm">
        <div className="flex items-center gap-3 mb-3">
          <img
            alt="Orbis — AI Product Research & Validation"
            src="https://ph-files.imgix.net/ae9fbd23-02fc-4e68-8c82-7803707afc58.png?auto=format&fit=crop&w=80&h=80"
            className="w-16 h-16 rounded-lg object-cover shrink-0"
          />
          <div className="min-w-0 flex-1">
            <h3 className="text-lg font-semibold text-foreground leading-tight truncate">
              Orbis — AI Product Research &amp; Validation
            </h3>
            <p className="text-sm text-muted-foreground mt-1 line-clamp-2">
              Stop guessing. Start validating product ideas
            </p>
          </div>
        </div>
        <a
          href="https://www.producthunt.com/products/orbis-ai-product-research-validation?embed=true&utm_source=embed&utm_medium=post_embed"
          target="_blank"
          rel="noopener noreferrer"
          className="inline-flex items-center gap-1 mt-3 px-4 py-2 bg-[#ff6154] hover:bg-[#e5564a] text-white rounded-lg text-sm font-semibold transition-colors"
        >
          Check it out on Product Hunt →
        </a>
      </div>
    </section>
  );
}
