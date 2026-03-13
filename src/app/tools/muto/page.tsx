export const metadata = {
  title: "Hungry Muto — mapleboss",
  description: "Quick reference for all Hungry Muto recipes in MapleStory N.",
};

const RECIPES = [
  { name: "Gamey Soup", file: "gamey_soup.png" },
  { name: "Fruit Salad", file: "fruit_salad.png" },
  { name: "Juicy Buns", file: "juicy_buns.png" },
  { name: "Nummy Noodles", file: "nummy_noodles.png" },
  { name: "Spicy Sausage", file: "spicy_sausage_recipe.png" },
  { name: "Chewy Porridge", file: "chewy_porridge.png" },
  { name: "Funky Pizza", file: "funky_pizza.png" },
  { name: "Dumpling Delights", file: "dumpling_delights.png" },
  { name: "Savory Stir Fry", file: "savory_stir_fry.png" },
  { name: "Weird Wrap", file: "weird_wrap.png" },
  { name: "Mystery Roast", file: "mystery_roast.png" },
  { name: "Berry Bouquet", file: "berry_bouquet.png" },
  { name: "Yucky Pickles", file: "yucky_pickles.png" },
];

export default function MutoPage() {
  return (
    <div>
      <div className="relative mb-8 text-center">
        <div className="hero-glow" />
        <div className="mb-2 inline-block rounded-full bg-[var(--color-accent)]/10 px-3 py-1 text-[11px] font-medium tracking-wide text-[var(--color-accent)] uppercase">
          MapleStory N
        </div>
        <h1 className="text-3xl font-bold tracking-tight md:text-4xl">
          Hungry Muto
        </h1>
        <p className="mx-auto mt-2 max-w-md text-sm text-[var(--color-muted)]">
          Recipe quick reference — all 13 recipes at a glance.
        </p>
      </div>

      <div className="mb-8 flex items-center gap-4">
        <div className="h-px flex-1 bg-gradient-to-r from-transparent via-[var(--color-border)] to-transparent" />
      </div>

      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
        {RECIPES.map((recipe) => (
          <div
            key={recipe.file}
            className="overflow-hidden rounded-xl border border-[var(--color-border)] bg-[var(--color-surface)]"
          >
            <img
              src={`/images/muto/${recipe.file}`}
              alt={recipe.name}
              className="w-full object-contain"
            />
            <div className="px-3 py-2 text-center text-xs font-medium text-[var(--color-secondary)]">
              {recipe.name}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
