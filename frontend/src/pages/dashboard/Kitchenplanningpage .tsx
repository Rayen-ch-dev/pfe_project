import React, { useState, useEffect } from 'react';

interface ReservationCounts {
  lunch: number;
  dinner: number;
}

interface Ingredient {
  name: string;
  qty: number;
  unit: string;
}

interface Recipe {
  label: string;
  type: 'main' | 'salad' | 'dessert';
  ingredients: Ingredient[];
}

interface AggregatedIngredient {
  name: string;
  unit: string;
  total: number;
  sources: string[];
}

const RECIPES: Record<string, Recipe> = {
  couscous: {
    label: 'Couscous', type: 'main',
    ingredients: [
      { name: 'Semoule', qty: 150, unit: 'g' },
      { name: 'Agneau', qty: 200, unit: 'g' },
      { name: 'Pois chiches', qty: 60, unit: 'g' },
      { name: 'Courgettes', qty: 80, unit: 'g' },
      { name: 'Carottes', qty: 80, unit: 'g' },
      { name: 'Tomates', qty: 100, unit: 'g' },
      { name: 'Harissa', qty: 20, unit: 'g' },
      { name: "Huile d'olive", qty: 20, unit: 'ml' },
    ],
  },
  spaghetti: {
    label: 'Spaghetti bolognaise', type: 'main',
    ingredients: [
      { name: 'Spaghetti', qty: 120, unit: 'g' },
      { name: 'Viande hachée', qty: 150, unit: 'g' },
      { name: 'Tomates concassées', qty: 120, unit: 'g' },
      { name: 'Oignons', qty: 60, unit: 'g' },
      { name: 'Ail', qty: 10, unit: 'g' },
      { name: "Huile d'olive", qty: 15, unit: 'ml' },
      { name: 'Parmesan', qty: 20, unit: 'g' },
    ],
  },
  tajine: {
    label: 'Tajine poulet', type: 'main',
    ingredients: [
      { name: 'Poulet', qty: 250, unit: 'g' },
      { name: 'Oignons', qty: 80, unit: 'g' },
      { name: 'Citron confit', qty: 30, unit: 'g' },
      { name: 'Olives', qty: 40, unit: 'g' },
      { name: 'Ras el hanout', qty: 8, unit: 'g' },
      { name: "Huile d'olive", qty: 20, unit: 'ml' },
    ],
  },
  grillades: {
    label: 'Grillades mixtes', type: 'main',
    ingredients: [
      { name: 'Viande de bœuf', qty: 150, unit: 'g' },
      { name: 'Merguez', qty: 80, unit: 'g' },
      { name: 'Poulet mariné', qty: 100, unit: 'g' },
      { name: 'Marinade (herbes)', qty: 20, unit: 'g' },
      { name: 'Huile végétale', qty: 15, unit: 'ml' },
    ],
  },
  poisson: {
    label: 'Poisson grillé', type: 'main',
    ingredients: [
      { name: 'Filet de poisson', qty: 200, unit: 'g' },
      { name: 'Citron', qty: 30, unit: 'g' },
      { name: 'Ail', qty: 8, unit: 'g' },
      { name: 'Persil', qty: 10, unit: 'g' },
      { name: "Huile d'olive", qty: 15, unit: 'ml' },
    ],
  },
  salade_verte: {
    label: 'Salade verte', type: 'salad',
    ingredients: [
      { name: 'Laitue', qty: 60, unit: 'g' },
      { name: 'Tomates', qty: 50, unit: 'g' },
      { name: 'Concombre', qty: 40, unit: 'g' },
      { name: 'Vinaigrette', qty: 20, unit: 'ml' },
    ],
  },
  salade_niçoise: {
    label: 'Salade niçoise', type: 'salad',
    ingredients: [
      { name: 'Laitue', qty: 50, unit: 'g' },
      { name: 'Thon en boîte', qty: 60, unit: 'g' },
      { name: 'Œufs durs', qty: 1, unit: 'pcs' },
      { name: 'Tomates', qty: 60, unit: 'g' },
      { name: 'Olives noires', qty: 20, unit: 'g' },
      { name: 'Haricots verts', qty: 40, unit: 'g' },
    ],
  },
  taboulé: {
    label: 'Taboulé', type: 'salad',
    ingredients: [
      { name: 'Boulgour', qty: 60, unit: 'g' },
      { name: 'Persil', qty: 30, unit: 'g' },
      { name: 'Menthe', qty: 10, unit: 'g' },
      { name: 'Tomates', qty: 60, unit: 'g' },
      { name: 'Jus de citron', qty: 20, unit: 'ml' },
    ],
  },
  fattoush: {
    label: 'Fattoush', type: 'salad',
    ingredients: [
      { name: 'Laitue romaine', qty: 60, unit: 'g' },
      { name: 'Tomates', qty: 50, unit: 'g' },
      { name: 'Radis', qty: 30, unit: 'g' },
      { name: 'Pain pita grillé', qty: 25, unit: 'g' },
      { name: 'Sumac', qty: 5, unit: 'g' },
    ],
  },
  fruit: {
    label: 'Fruits de saison', type: 'dessert',
    ingredients: [{ name: 'Fruits assortis', qty: 150, unit: 'g' }],
  },
  yaourt: {
    label: 'Yaourt nature', type: 'dessert',
    ingredients: [{ name: 'Yaourt nature', qty: 125, unit: 'g' }],
  },
  crème: {
    label: 'Crème caramel', type: 'dessert',
    ingredients: [
      { name: 'Œufs', qty: 1, unit: 'pcs' },
      { name: 'Lait entier', qty: 120, unit: 'ml' },
      { name: 'Sucre', qty: 40, unit: 'g' },
    ],
  },
  baklawa: {
    label: 'Baklawa', type: 'dessert',
    ingredients: [
      { name: 'Pâte filo', qty: 40, unit: 'g' },
      { name: 'Miel', qty: 30, unit: 'g' },
      { name: 'Amandes', qty: 30, unit: 'g' },
      { name: 'Beurre fondu', qty: 15, unit: 'g' },
    ],
  },
};

const MAIN_OPTIONS = [
  { value: '', label: '— choisir —' },
  { value: 'couscous', label: 'Couscous' },
  { value: 'spaghetti', label: 'Spaghetti bolognaise' },
  { value: 'tajine', label: 'Tajine poulet' },
  { value: 'grillades', label: 'Grillades mixtes' },
  { value: 'poisson', label: 'Poisson grillé' },
];

const SALAD_OPTIONS = [
  { value: '', label: '— choisir —' },
  { value: 'salade_verte', label: 'Salade verte' },
  { value: 'salade_niçoise', label: 'Salade niçoise' },
  { value: 'taboulé', label: 'Taboulé' },
  { value: 'fattoush', label: 'Fattoush' },
];

const DESSERT_OPTIONS = [
  { value: '', label: '— choisir —' },
  { value: 'fruit', label: 'Fruits de saison' },
  { value: 'yaourt', label: 'Yaourt nature' },
  { value: 'crème', label: 'Crème caramel' },
  { value: 'baklawa', label: 'Baklawa' },
];

// ─── Replace this with a real API call ────────────────────────────────────────
async function fetchReservationCounts(date: string): Promise<ReservationCounts> {
  // TODO: replace with dashboardService.getReservationCountsByDate(date)
  const mock: Record<string, ReservationCounts> = {
    '2026-05-20': { lunch: 24, dinner: 18 },
    '2026-05-21': { lunch: 30, dinner: 22 },
    '2026-05-22': { lunch: 15, dinner: 28 },
    '2026-05-23': { lunch: 35, dinner: 10 },
    '2026-05-24': { lunch: 20, dinner: 20 },
  };
  return mock[date] ?? { lunch: 0, dinner: 0 };
}
// ─────────────────────────────────────────────────────────────────────────────

function getTodayISO() {
  return new Date().toISOString().split('T')[0];
}

function formatDateFR(dateStr: string) {
  return new Date(dateStr).toLocaleDateString('fr-FR', {
    weekday: 'long', day: 'numeric', month: 'long', year: 'numeric',
  });
}

function aggregateIngredients(
  recipes: Array<{ key: string; count: number; mealLabel: string }>,
): AggregatedIngredient[] {
  const map: Record<string, AggregatedIngredient> = {};
  recipes.forEach(({ key, count, mealLabel }) => {
    const recipe = RECIPES[key];
    if (!recipe) return;
    recipe.ingredients.forEach((ing) => {
      const k = `${ing.name}|${ing.unit}`;
      if (!map[k]) map[k] = { name: ing.name, unit: ing.unit, total: 0, sources: [] };
      map[k].total += ing.qty * count;
      if (!map[k].sources.includes(mealLabel)) map[k].sources.push(mealLabel);
    });
  });
  return Object.values(map).sort((a, b) => a.name.localeCompare(b.name));
}

function formatQty(total: number, unit: string) {
  if (unit === 'pcs') return `${Math.round(total)} pcs`;
  if ((unit === 'g' || unit === 'ml') && total >= 1000)
    return `${(total / 1000).toFixed(1)} ${unit === 'g' ? 'kg' : 'L'}`;
  return `${Math.round(total)} ${unit}`;
}

// ── Sub-components ────────────────────────────────────────────────────────────

const StatCard: React.FC<{
  label: string; value: number | string; color: string; sub?: string;
}> = ({ label, value, color, sub }) => (
  <div className="bg-gray-100 dark:bg-gray-800 rounded-xl p-4">
    <p className="text-xs text-gray-500 dark:text-gray-400 mb-1">{label}</p>
    <p className={`text-2xl font-semibold ${color}`}>{value}</p>
    {sub && <p className="text-xs text-gray-400 dark:text-gray-500 mt-1">{sub}</p>}
  </div>
);

const CourseSelect: React.FC<{
  label: string;
  options: { value: string; label: string }[];
  value: string;
  onChange: (v: string) => void;
}> = ({ label, options, value, onChange }) => (
  <div className="grid grid-cols-[88px_1fr] items-center gap-2 mb-2">
    <span className="text-xs font-medium text-gray-500 dark:text-gray-400">{label}</span>
    <select
      value={value}
      onChange={(e) => onChange(e.target.value)}
      className="w-full px-3 py-2 text-sm border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-800 text-gray-900 dark:text-gray-100 focus:ring-2 focus:ring-blue-500 focus:border-transparent"
    >
      {options.map((o) => <option key={o.value} value={o.value}>{o.label}</option>)}
    </select>
  </div>
);

const Badge: React.FC<{ children: React.ReactNode; color: string }> = ({ children, color }) => (
  <span className={`inline-flex items-center gap-1 px-3 py-1 rounded-full text-xs font-medium ${color}`}>
    {children}
  </span>
);

// ── Main page ─────────────────────────────────────────────────────────────────

const KitchenPlanningPage: React.FC = () => {
  const [date, setDate] = useState(getTodayISO());
  const [counts, setCounts] = useState<ReservationCounts>({ lunch: 0, dinner: 0 });
  const [loadingCounts, setLoadingCounts] = useState(false);

  const [lunchMain, setLunchMain] = useState('');
  const [lunchSalad, setLunchSalad] = useState('');
  const [lunchDessert, setLunchDessert] = useState('');
  const [dinnerMain, setDinnerMain] = useState('');
  const [dinnerSalad, setDinnerSalad] = useState('');
  const [dinnerDessert, setDinnerDessert] = useState('');

  const [ingredients, setIngredients] = useState<AggregatedIngredient[]>([]);
  const [calculated, setCalculated] = useState(false);
  const [formError, setFormError] = useState('');

  useEffect(() => {
    if (!date) return;
    setCalculated(false);
    setIngredients([]);
    setLoadingCounts(true);
    fetchReservationCounts(date)
      .then(setCounts)
      .finally(() => setLoadingCounts(false));
  }, [date]);

  const handleCalculate = () => {
    if (!lunchMain || !lunchSalad || !lunchDessert || !dinnerMain || !dinnerSalad || !dinnerDessert) {
      setFormError('Veuillez compléter tous les choix de plats pour les deux repas.');
      return;
    }
    setFormError('');
    const result = aggregateIngredients([
      { key: lunchMain, count: counts.lunch, mealLabel: 'Déjeuner' },
      { key: lunchSalad, count: counts.lunch, mealLabel: 'Déjeuner' },
      { key: lunchDessert, count: counts.lunch, mealLabel: 'Déjeuner' },
      { key: dinnerMain, count: counts.dinner, mealLabel: 'Dîner' },
      { key: dinnerSalad, count: counts.dinner, mealLabel: 'Dîner' },
      { key: dinnerDessert, count: counts.dinner, mealLabel: 'Dîner' },
    ]);
    setIngredients(result);
    setCalculated(true);
  };

  const maxQty = ingredients.length ? Math.max(...ingredients.map((i) => i.total)) : 1;
  const total = counts.lunch + counts.dinner;

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-950 transition-colors">

      {/* Header */}
      <div className="bg-white dark:bg-gray-900 shadow-sm border-b border-gray-200 dark:border-gray-700">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between h-16">
            <div>
              <h1 className="text-xl font-bold text-gray-900 dark:text-white">
                Planification cuisine
              </h1>
              <p className="text-sm text-gray-500 dark:text-gray-400">
                Composez les menus et calculez les ingrédients à préparer
              </p>
            </div>
            {calculated && (
              <span className="px-3 py-1.5 text-xs font-semibold rounded-full bg-blue-50 dark:bg-blue-950/40 text-blue-700 dark:text-blue-300 border border-blue-100 dark:border-blue-800">
                {total} couverts planifiés
              </span>
            )}
          </div>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6 space-y-6">

        {/* Stat cards */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          <StatCard
            label="Déjeuners"
            value={loadingCounts ? '…' : counts.lunch}
            color="text-orange-500 dark:text-orange-400"
            sub="réservations confirmées"
          />
          <StatCard
            label="Dîners"
            value={loadingCounts ? '…' : counts.dinner}
            color="text-purple-600 dark:text-purple-400"
            sub="réservations confirmées"
          />
          <StatCard
            label="Total couverts"
            value={loadingCounts ? '…' : total}
            color="text-gray-900 dark:text-white"
            sub="pour la date choisie"
          />
          <StatCard
            label="Ingrédients"
            value={calculated ? ingredients.length : '—'}
            color="text-gray-900 dark:text-white"
            sub="types à préparer"
          />
        </div>

        {/* Date picker */}
        <div className="bg-white dark:bg-gray-900 rounded-xl shadow-sm border border-gray-200 dark:border-gray-700 p-6">
          <div className="flex flex-col sm:flex-row sm:items-end gap-4">
            <div className="flex-1 max-w-xs">
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                Date de service
              </label>
              <input
                type="date"
                value={date}
                onChange={(e) => setDate(e.target.value)}
                className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-800 text-gray-900 dark:text-gray-100 focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              />
            </div>
            {date && (
              <p className="text-sm text-gray-500 dark:text-gray-400 pb-2 capitalize">
                {formatDateFR(date)}
                {!loadingCounts && (
                  <span className="ml-2 font-medium text-gray-700 dark:text-gray-300">
                    · {counts.lunch} déjeuners · {counts.dinner} dîners
                  </span>
                )}
              </p>
            )}
          </div>
        </div>

        {/* Menu composer */}
        <div className="bg-white dark:bg-gray-900 rounded-xl shadow-sm border border-gray-200 dark:border-gray-700 p-6">
          <h2 className="text-sm font-semibold text-gray-500 dark:text-gray-400 uppercase tracking-wider mb-5">
            Composition des menus
          </h2>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">

            {/* Déjeuner */}
            <div className="border border-orange-100 dark:border-orange-900/40 bg-orange-50/40 dark:bg-orange-950/10 rounded-xl p-5">
              <div className="flex items-center gap-3 mb-4">
                <div className="h-9 w-9 rounded-full bg-orange-100 dark:bg-orange-900/40 flex items-center justify-center text-base">☀️</div>
                <div>
                  <p className="text-sm font-semibold text-gray-800 dark:text-gray-200">Déjeuner</p>
                  <p className="text-xs text-gray-500 dark:text-gray-400">
                    Midi · {loadingCounts ? '…' : counts.lunch} couverts
                  </p>
                </div>
              </div>
              <CourseSelect label="Plat principal" options={MAIN_OPTIONS} value={lunchMain} onChange={setLunchMain} />
              <CourseSelect label="Salade" options={SALAD_OPTIONS} value={lunchSalad} onChange={setLunchSalad} />
              <CourseSelect label="Dessert" options={DESSERT_OPTIONS} value={lunchDessert} onChange={setLunchDessert} />
            </div>

            {/* Dîner */}
            <div className="border border-purple-100 dark:border-purple-900/40 bg-purple-50/40 dark:bg-purple-950/10 rounded-xl p-5">
              <div className="flex items-center gap-3 mb-4">
                <div className="h-9 w-9 rounded-full bg-purple-100 dark:bg-purple-900/40 flex items-center justify-center text-base">🌙</div>
                <div>
                  <p className="text-sm font-semibold text-gray-800 dark:text-gray-200">Dîner</p>
                  <p className="text-xs text-gray-500 dark:text-gray-400">
                    Soir · {loadingCounts ? '…' : counts.dinner} couverts
                  </p>
                </div>
              </div>
              <CourseSelect label="Plat principal" options={MAIN_OPTIONS} value={dinnerMain} onChange={setDinnerMain} />
              <CourseSelect label="Salade" options={SALAD_OPTIONS} value={dinnerSalad} onChange={setDinnerSalad} />
              <CourseSelect label="Dessert" options={DESSERT_OPTIONS} value={dinnerDessert} onChange={setDinnerDessert} />
            </div>
          </div>

          {formError && (
            <p className="mt-4 text-sm text-red-600 dark:text-red-400 bg-red-50 dark:bg-red-950/40 border border-red-200 dark:border-red-800 rounded-lg px-4 py-2">
              {formError}
            </p>
          )}

          <div className="mt-5 flex justify-end">
            <button
              onClick={handleCalculate}
              className="px-6 py-2.5 bg-blue-600 hover:bg-blue-700 text-white rounded-lg text-sm font-medium transition-colors"
            >
              Calculer les ingrédients →
            </button>
          </div>
        </div>

        {/* Results */}
        {calculated && (
          <>
            {/* Menu recap */}
            <div className="bg-white dark:bg-gray-900 rounded-xl shadow-sm border border-gray-200 dark:border-gray-700 p-6">
              <h2 className="text-sm font-semibold text-gray-500 dark:text-gray-400 uppercase tracking-wider mb-4">
                Récapitulatif des menus
              </h2>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="bg-orange-50 dark:bg-orange-950/20 border border-orange-100 dark:border-orange-900/40 rounded-xl p-4">
                  <p className="text-sm font-semibold text-orange-700 dark:text-orange-300 mb-3">
                    ☀️ Déjeuner · {counts.lunch} couverts
                  </p>
                  <div className="flex flex-col gap-2">
                    <Badge color="bg-orange-100 dark:bg-orange-900/40 text-orange-800 dark:text-orange-200">
                      🍲 {RECIPES[lunchMain]?.label}
                    </Badge>
                    <Badge color="bg-green-100 dark:bg-green-900/40 text-green-800 dark:text-green-200">
                      🥗 {RECIPES[lunchSalad]?.label}
                    </Badge>
                    <Badge color="bg-blue-100 dark:bg-blue-900/40 text-blue-800 dark:text-blue-200">
                      🍮 {RECIPES[lunchDessert]?.label}
                    </Badge>
                  </div>
                </div>
                <div className="bg-purple-50 dark:bg-purple-950/20 border border-purple-100 dark:border-purple-900/40 rounded-xl p-4">
                  <p className="text-sm font-semibold text-purple-700 dark:text-purple-300 mb-3">
                    🌙 Dîner · {counts.dinner} couverts
                  </p>
                  <div className="flex flex-col gap-2">
                    <Badge color="bg-purple-100 dark:bg-purple-900/40 text-purple-800 dark:text-purple-200">
                      🍲 {RECIPES[dinnerMain]?.label}
                    </Badge>
                    <Badge color="bg-green-100 dark:bg-green-900/40 text-green-800 dark:text-green-200">
                      🥗 {RECIPES[dinnerSalad]?.label}
                    </Badge>
                    <Badge color="bg-blue-100 dark:bg-blue-900/40 text-blue-800 dark:text-blue-200">
                      🍮 {RECIPES[dinnerDessert]?.label}
                    </Badge>
                  </div>
                </div>
              </div>
            </div>

            {/* Ingredients table */}
            <div className="bg-white dark:bg-gray-900 rounded-xl shadow-sm border border-gray-200 dark:border-gray-700 overflow-hidden">
              <div className="px-6 py-4 border-b border-gray-200 dark:border-gray-700 flex items-center justify-between">
                <h2 className="text-sm font-semibold text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                  Liste des ingrédients à préparer
                </h2>
                <span className="text-xs text-gray-400 dark:text-gray-500">
                  Quantités calculées pour tous les couverts
                </span>
              </div>
              <div className="overflow-x-auto">
                <table className="min-w-full divide-y divide-gray-200 dark:divide-gray-700">
                  <thead className="bg-gray-50 dark:bg-gray-800/50">
                    <tr>
                      <th className="px-6 py-3 text-left text-xs font-semibold text-gray-600 dark:text-gray-400 uppercase tracking-wider">
                        Ingrédient
                      </th>
                      <th className="px-6 py-3 text-left text-xs font-semibold text-gray-600 dark:text-gray-400 uppercase tracking-wider">
                        Quantité totale
                      </th>
                      <th className="px-6 py-3 text-left text-xs font-semibold text-gray-600 dark:text-gray-400 uppercase tracking-wider w-48">
                        Répartition
                      </th>
                      <th className="px-6 py-3 text-left text-xs font-semibold text-gray-600 dark:text-gray-400 uppercase tracking-wider">
                        Utilisé dans
                      </th>
                    </tr>
                  </thead>
                  <tbody className="bg-white dark:bg-gray-900 divide-y divide-gray-200 dark:divide-gray-700">
                    {ingredients.map((ing) => {
                      const pct = Math.round((ing.total / maxQty) * 100);
                      return (
                        <tr key={`${ing.name}|${ing.unit}`} className="hover:bg-gray-50 dark:hover:bg-gray-800/50 transition-colors">
                          <td className="px-6 py-3 text-sm font-medium text-gray-900 dark:text-white">
                            {ing.name}
                          </td>
                          <td className="px-6 py-3">
                            <span className="text-base font-semibold text-gray-900 dark:text-white">
                              {formatQty(ing.total, ing.unit)}
                            </span>
                          </td>
                          <td className="px-6 py-3">
                            <div className="w-full bg-gray-100 dark:bg-gray-800 rounded-full h-1.5">
                              <div
                                className="bg-blue-500 dark:bg-blue-400 h-1.5 rounded-full transition-all duration-500"
                                style={{ width: `${pct}%` }}
                              />
                            </div>
                          </td>
                          <td className="px-6 py-3">
                            <div className="flex flex-wrap gap-1">
                              {ing.sources.map((s) => (
                                <span
                                  key={s}
                                  className={`inline-flex px-2 py-0.5 text-xs rounded-md font-medium ${
                                    s === 'Déjeuner'
                                      ? 'bg-orange-100 dark:bg-orange-950/40 text-orange-700 dark:text-orange-300'
                                      : 'bg-purple-100 dark:bg-purple-950/40 text-purple-700 dark:text-purple-300'
                                  }`}
                                >
                                  {s}
                                </span>
                              ))}
                            </div>
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>
              <div className="px-6 py-3 bg-gray-50 dark:bg-gray-800/50 border-t border-gray-200 dark:border-gray-700">
                <p className="text-xs text-gray-500 dark:text-gray-400">
                  {ingredients.length} ingrédients · calculés pour {counts.lunch} déjeuners + {counts.dinner} dîners
                </p>
              </div>
            </div>
          </>
        )}
      </div>
    </div>
  );
};

export default KitchenPlanningPage;