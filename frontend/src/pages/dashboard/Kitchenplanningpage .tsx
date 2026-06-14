import React, { useState, useEffect } from 'react';
import { recipeService } from '../../services/recipeService';
import type { Recipe } from '../../services/recipeService';
function storageGet(key) {
  try { const r = localStorage.getItem(key); return r ? JSON.parse(r) : null; } catch { return null; }
}
function storageSet(key, val) {
  try { localStorage.setItem(key, JSON.stringify(val)); } catch {}
}

const UNITS = ['g', 'kg', 'ml', 'l', 'pcs', 'tsp', 'tbsp'];
const TYPES = ['main', 'salad', 'dessert'];
const TYPE_LABELS = { main: 'Plat principal', salad: 'Salade', dessert: 'Dessert' };
const TABS = [
  { id: 'create', label: 'Créer un menu', icon: '＋' },
  { id: 'plan', label: 'Planification', icon: '' },
  { id: 'ingredients', label: 'Ingrédients', icon: '' },
];

function getTodayISO() { return new Date().toISOString().split('T')[0]; }
function formatDateFR(d) {
  return new Date(d).toLocaleDateString('fr-FR', { weekday: 'long', day: 'numeric', month: 'long', year: 'numeric' });
}
function formatQty(total, unit) {
  if (unit === 'pcs') return `${Math.round(total)} pcs`;
  if ((unit === 'g' || unit === 'ml') && total >= 1000)
    return `${(total / 1000).toFixed(1)} ${unit === 'g' ? 'kg' : 'L'}`;
  return `${Math.round(total)} ${unit}`;
}
function aggregateIngredients(recipes, RECIPES) {
  const map = {};
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
async function fetchReservationCounts(date) {
  try {
    return await recipeService.getReservationCountsByDate(date);
  } catch (error) {
    console.error('Failed to fetch reservation counts:', error);
    return { lunch: 0, dinner: 0 };
  }
}

// ─── Panel 1: Menu Creator ────────────────────────────────────────────────────
function MenuCreator({ recipes, setRecipes }) {
  const [name, setName] = useState('');
  const [type, setType] = useState('main');
  const [ingredients, setIngredients] = useState([{ name: '', qty: '', unit: 'g' }]);
  const [saved, setSaved] = useState(false);
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  const addRow = () => setIngredients([...ingredients, { name: '', qty: '', unit: 'g' }]);
  const removeRow = (i) => setIngredients(ingredients.filter((_, idx) => idx !== i));
  const updateRow = (i, field, val) => {
    const updated = [...ingredients];
    updated[i] = { ...updated[i], [field]: val };
    setIngredients(updated);
  };

  const handleSave = async () => {
    if (!name.trim()) { setError('Nom du menu requis.'); return; }
    const valid = ingredients.filter(r => r.name.trim() && r.qty && !isNaN(r.qty));
    if (!valid.length) { setError('Ajoutez au moins un ingrédient valide.'); return; }
    setError('');
    setLoading(true);

    try {
      const newRecipe = { 
        label: name.trim(), 
        type, 
        ingredients: valid.map(r => ({ name: r.name.trim(), qty: parseFloat(r.qty), unit: r.unit })) 
      };
      const created = await recipeService.createRecipe(newRecipe);
      
      // Add to local state with ID as key
      const updated = { ...recipes, [created.id!]: created };
      setRecipes(updated);
      
      setSaved(true);
      setTimeout(() => setSaved(false), 2500);
      setName(''); setIngredients([{ name: '', qty: '', unit: 'g' }]); setType('main');
    } catch (err) {
      console.error('Failed to create recipe:', err);
      setError('Erreur lors de la création du menu.');
    } finally {
      setLoading(false);
    }
  };

  const handleDelete = async (recipeId: string) => {
    try {
      await recipeService.deleteRecipe(recipeId);
      const updated = { ...recipes };
      delete updated[recipeId];
      setRecipes(updated);
    } catch (err) {
      console.error('Failed to delete recipe:', err);
    }
  };

  const customRecipes = Object.values(recipes);

  return (
    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
      {/* Form */}
      <div>
        <p className="text-sm text-gray-500 dark:text-gray-400 mb-5">
          Définissez un nouveau menu avec ses ingrédients par couvert.
        </p>

        <div className="mb-4">
          <label className="block text-xs font-medium text-gray-500 dark:text-gray-400 mb-1">Nom du menu</label>
          <input
            value={name} onChange={e => setName(e.target.value)}
            placeholder="Ex: Riz au poulet"
            className="w-full px-3 py-2 text-sm border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-800 text-gray-900 dark:text-gray-100 focus:outline-none focus:ring-2 focus:ring-blue-500"
          />
        </div>

        <div className="mb-5">
          <label className="block text-xs font-medium text-gray-500 dark:text-gray-400 mb-2">Type de cours</label>
          <div className="flex gap-2">
            {TYPES.map(t => (
              <button key={t} onClick={() => setType(t)}
                className={`flex-1 py-1.5 text-xs rounded-lg border transition-colors cursor-pointer ${
                  type === t
                    ? 'bg-blue-50 dark:bg-blue-950/40 text-blue-700 dark:text-blue-300 border-blue-300 dark:border-blue-700 font-medium'
                    : 'bg-white dark:bg-gray-800 text-gray-500 dark:text-gray-400 border-gray-200 dark:border-gray-700 hover:bg-gray-50 dark:hover:bg-gray-750'
                }`}>
                {TYPE_LABELS[t]}
              </button>
            ))}
          </div>
        </div>

        <div className="mb-5">
          <div className="flex items-center justify-between mb-2">
            <label className="text-xs font-medium text-gray-500 dark:text-gray-400">Ingrédients (par couvert)</label>
            <button onClick={addRow}
              className="text-xs px-3 py-1 rounded-lg border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-800 text-gray-600 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-gray-700 cursor-pointer">
              + Ligne
            </button>
          </div>
          <div className="space-y-2">
            {ingredients.map((row, i) => (
              <div key={i} className="grid grid-cols-[1fr_72px_72px_28px] gap-2 items-center">
                <input value={row.name} onChange={e => updateRow(i, 'name', e.target.value)} placeholder="Ingrédient"
                  className="px-2.5 py-1.5 text-sm border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-800 text-gray-900 dark:text-gray-100 focus:outline-none focus:ring-2 focus:ring-blue-500" />
                <input value={row.qty} onChange={e => updateRow(i, 'qty', e.target.value)} placeholder="Qté" type="number"
                  className="px-2.5 py-1.5 text-sm border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-800 text-gray-900 dark:text-gray-100 focus:outline-none focus:ring-2 focus:ring-blue-500" />
                <select value={row.unit} onChange={e => updateRow(i, 'unit', e.target.value)}
                  className="px-2 py-1.5 text-sm border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-800 text-gray-900 dark:text-gray-100 focus:outline-none focus:ring-2 focus:ring-blue-500">
                  {UNITS.map(u => <option key={u} value={u}>{u}</option>)}
                </select>
                <button onClick={() => removeRow(i)}
                  className="text-red-400 hover:text-red-600 dark:text-red-500 dark:hover:text-red-400 text-base leading-none cursor-pointer bg-transparent border-none">✕</button>
              </div>
            ))}
          </div>
        </div>

        {error && (
          <p className="text-xs text-red-600 dark:text-red-400 bg-red-50 dark:bg-red-950/40 border border-red-200 dark:border-red-800 rounded-lg px-3 py-2 mb-3">
            {error}
          </p>
        )}

        <button onClick={handleSave}
          disabled={loading}
          className={`w-full py-2.5 rounded-lg text-sm font-medium transition-colors cursor-pointer ${
            saved
              ? 'bg-green-50 dark:bg-green-950/40 text-green-700 dark:text-green-300 border border-green-300 dark:border-green-700'
              : 'bg-blue-600 hover:bg-blue-700 text-white border border-transparent'
          } ${loading ? 'opacity-50 cursor-not-allowed' : ''}`}>
          {loading ? 'Enregistrement...' : saved ? '✓ Menu enregistré !' : 'Enregistrer le menu'}
        </button>
      </div>

      {/* Custom menus list */}
      <div>
        <p className="text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider mb-3">
          Menus disponibles ({customRecipes.length})
        </p>
        {customRecipes.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-12 bg-gray-50 dark:bg-gray-800/50 rounded-xl border border-dashed border-gray-300 dark:border-gray-700">
            <p className="text-sm text-gray-400 dark:text-gray-500">Aucun menu disponible</p>
            <p className="text-xs text-gray-400 dark:text-gray-500 mt-1">Créez votre premier menu ci-contre</p>
          </div>
        ) : (
          <div className="space-y-2">
            {customRecipes.map((r: Recipe) => (
              <div key={r.id} className="bg-white dark:bg-gray-800 rounded-xl border border-gray-200 dark:border-gray-700 px-4 py-3">
                <div className="flex items-center justify-between mb-1">
                  <span className="text-sm font-medium text-gray-900 dark:text-white">{r.label}</span>
                  <div className="flex items-center gap-2">
                    <span className="text-xs px-2 py-0.5 rounded-full bg-blue-50 dark:bg-blue-950/40 text-blue-700 dark:text-blue-300">
                      {TYPE_LABELS[r.type]}
                    </span>
                    <button
                      onClick={() => handleDelete(r.id!)}
                      className="text-xs text-red-500 hover:text-red-700 dark:text-red-400 dark:hover:text-red-300 cursor-pointer bg-transparent border-none">
                      Supprimer
                    </button>
                  </div>
                </div>
                <p className="text-xs text-gray-400 dark:text-gray-500 truncate">
                  {r.ingredients.map(i => i.name).join(', ')}
                </p>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}

// ─── Shared MealCard ──────────────────────────────────────────────────────────
function MealCard({ icon, title, color, plan, prefix, byType, setPlan }) {
  const isOrange = color === 'orange';
  const cardCls = isOrange
    ? 'border border-orange-200 dark:border-orange-900/50 bg-orange-50/50 dark:bg-orange-950/10'
    : 'border border-purple-200 dark:border-purple-900/50 bg-purple-50/50 dark:bg-purple-950/10';
  const titleCls = isOrange ? 'text-orange-700 dark:text-orange-300' : 'text-purple-700 dark:text-purple-300';
  const iconBg = isOrange ? 'bg-orange-100 dark:bg-orange-900/40' : 'bg-purple-100 dark:bg-purple-900/40';

  return (
    <div className={`rounded-xl p-4 ${cardCls}`}>
      <div className="flex items-center gap-2.5 mb-4">
        <div className={`w-9 h-9 rounded-full flex items-center justify-center text-lg ${iconBg}`}>{icon}</div>
        <span className={`text-sm font-semibold ${titleCls}`}>{title}</span>
      </div>
      {[
        { field: `${prefix}Main`, type: 'main', label: 'Plat' },
        { field: `${prefix}Salad`, type: 'salad', label: 'Salade' },
        { field: `${prefix}Dessert`, type: 'dessert', label: 'Dessert' },
      ].map(({ field, type, label }) => (
        <div key={field} className="grid grid-cols-[56px_1fr] items-center gap-2 mb-2">
          <span className="text-xs text-gray-500 dark:text-gray-400">{label}</span>
          <select value={plan[field] || ''} onChange={e => setPlan(field, e.target.value)}
            className="w-full px-2.5 py-1.5 text-xs border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-800 text-gray-900 dark:text-gray-100 focus:outline-none focus:ring-2 focus:ring-blue-500">
            {byType(type).map(o => <option key={o.value} value={o.value}>{o.label}</option>)}
          </select>
        </div>
      ))}
    </div>
  );
}

// ─── Panel 2: Planning ────────────────────────────────────────────────────────
function Planning({ recipes, plans, setPlans }) {
  const [mode, setMode] = useState('day');
  const [date, setDate] = useState(getTodayISO());
  const [saved, setSaved] = useState(false);

  const byType = (t) => [{ value: '', label: '— choisir —' }, ...Object.values(recipes).filter((r: Recipe) => r.type === t).map((r: Recipe) => ({ value: r.id, label: r.label }))];
  const plan = plans[date] || { lunchMain: '', lunchSalad: '', lunchDessert: '', dinnerMain: '', dinnerSalad: '', dinnerDessert: '' };
  const setPlan = (field, val) => setPlans(prev => ({ ...prev, [date]: { ...(prev[date] || {}), [field]: val } }));
  const savePlan = async () => { await storageSet('meal-plans', plans); setSaved(true); setTimeout(() => setSaved(false), 2000); };

  const weekDates = Array.from({ length: 7 }, (_, i) => {
    const d = new Date(date);
    const monday = new Date(d);
    monday.setDate(d.getDate() - ((d.getDay() + 6) % 7) + i);
    return monday.toISOString().split('T')[0];
  });

  const planComplete = (d) => { const p = plans[d]; return p && p.lunchMain && p.dinnerMain; };

  return (
    <div>
      {/* Controls */}
      <div className="flex flex-wrap items-center gap-2 mb-5">
        <div className="flex gap-1 p-1 bg-gray-100 dark:bg-gray-800 rounded-lg">
          {['day', 'week', 'month'].map(m => (
            <button key={m} onClick={() => setMode(m)}
              className={`px-4 py-1.5 text-xs rounded-md font-medium transition-colors cursor-pointer ${
                mode === m
                  ? 'bg-white dark:bg-gray-700 text-gray-900 dark:text-white shadow-sm'
                  : 'text-gray-500 dark:text-gray-400 hover:text-gray-700 dark:hover:text-gray-300'
              }`}>
              {m === 'day' ? 'Jour' : m === 'week' ? 'Semaine' : 'Mois'}
            </button>
          ))}
        </div>
        <input type="date" value={date} onChange={e => setDate(e.target.value)}
          className="ml-auto px-3 py-1.5 text-sm border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-800 text-gray-900 dark:text-gray-100 focus:outline-none focus:ring-2 focus:ring-blue-500" />
      </div>

      {mode === 'day' && (
        <>
          <p className="text-sm text-gray-500 dark:text-gray-400 capitalize mb-4">{formatDateFR(date)}</p>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <MealCard icon="" title="Déjeuner" color="orange" plan={plan} prefix="lunch" byType={byType} setPlan={setPlan} />
            <MealCard icon="" title="Dîner" color="purple" plan={plan} prefix="dinner" byType={byType} setPlan={setPlan} />
          </div>
          <div className="flex justify-end mt-4">
            <button onClick={savePlan}
              className={`px-6 py-2 rounded-lg text-sm font-medium transition-colors cursor-pointer ${
                saved
                  ? 'bg-green-50 dark:bg-green-950/40 text-green-700 dark:text-green-300 border border-green-300 dark:border-green-700'
                  : 'bg-blue-600 hover:bg-blue-700 text-white'
              }`}>
              {saved ? '✓ Enregistré' : 'Enregistrer'}
            </button>
          </div>
        </>
      )}

      {(mode === 'week' || mode === 'month') && (
        <WeekMonthView
          dates={mode === 'week' ? weekDates : getMonthDates(date)}
          plans={plans} setPlans={setPlans} recipes={recipes}
          byType={byType} planComplete={planComplete} mode={mode}
        />
      )}
    </div>
  );
}

function getMonthDates(dateStr) {
  const d = new Date(dateStr);
  const year = d.getFullYear(), month = d.getMonth();
  const days = new Date(year, month + 1, 0).getDate();
  return Array.from({ length: days }, (_, i) => new Date(year, month, i + 1).toISOString().split('T')[0]);
}

function WeekMonthView({ dates, plans, setPlans, recipes, byType, planComplete, mode }) {
  const [editing, setEditing] = useState(null);
  const [saved, setSaved] = useState(false);
  const dayNames = ['Lun', 'Mar', 'Mer', 'Jeu', 'Ven', 'Sam', 'Dim'];

  const editPlan = editing ? (plans[editing] || { lunchMain: '', lunchSalad: '', lunchDessert: '', dinnerMain: '', dinnerSalad: '', dinnerDessert: '' }) : null;
  const setEditPlan = (field, val) => {
    if (!editing) return;
    setPlans(prev => ({ ...prev, [editing]: { ...(prev[editing] || {}), [field]: val } }));
  };
  const save = async () => { await storageSet('meal-plans', plans); setSaved(true); setTimeout(() => setSaved(false), 2000); setEditing(null); };

  return (
    <div>
      <div className="grid grid-cols-7 gap-1 mb-1">
        {dayNames.map(d => <div key={d} className="text-center text-xs text-gray-400 dark:text-gray-500 py-1">{d}</div>)}
      </div>
      <div className="grid grid-cols-7 gap-1">
        {mode === 'month' && Array.from({ length: (new Date(dates[0]).getDay() + 6) % 7 }).map((_, i) => <div key={`e${i}`} />)}
        {dates.map(d => {
          const complete = planComplete(d);
          const isToday = d === getTodayISO();
          const isEditing = editing === d;
          return (
            <button key={d} onClick={() => setEditing(isEditing ? null : d)}
              className={`rounded-lg cursor-pointer transition-colors text-center
                ${mode === 'week' ? 'py-3 min-h-[64px]' : 'py-2'}
                ${isEditing ? 'ring-2 ring-blue-500' : ''}
                ${isToday ? 'border-2 border-blue-400 dark:border-blue-500' : 'border border-gray-200 dark:border-gray-700'}
                ${complete
                  ? 'bg-green-50 dark:bg-green-950/30 hover:bg-green-100 dark:hover:bg-green-950/50'
                  : 'bg-white dark:bg-gray-800 hover:bg-gray-50 dark:hover:bg-gray-750'
                }`}>
              <div className={`text-sm ${isToday ? 'font-semibold text-blue-600 dark:text-blue-400' : 'text-gray-700 dark:text-gray-300'}`}>
                {new Date(d).getDate()}
              </div>
              {complete && <div className="text-xs text-green-600 dark:text-green-400 mt-0.5">✓</div>}
              {!complete && mode === 'week' && <div className="text-xs text-gray-300 dark:text-gray-600 mt-0.5">—</div>}
            </button>
          );
        })}
      </div>

      {editing && editPlan && (
        <div className="mt-4 border border-gray-200 dark:border-gray-700 rounded-xl p-4 bg-white dark:bg-gray-900">
          <div className="flex items-center justify-between mb-3">
            <p className="text-sm font-medium text-gray-800 dark:text-gray-200 capitalize">{formatDateFR(editing)}</p>
            <button onClick={() => setEditing(null)} className="text-sm text-gray-400 hover:text-gray-600 dark:hover:text-gray-300 cursor-pointer bg-transparent border-none">✕ Fermer</button>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
            <MealCard icon="" title="Déjeuner" color="orange" plan={editPlan} prefix="lunch" byType={byType} setPlan={setEditPlan} />
            <MealCard icon="" title="Dîner" color="purple" plan={editPlan} prefix="dinner" byType={byType} setPlan={setEditPlan} />
          </div>
          <div className="flex justify-end mt-3">
            <button onClick={save}
              className={`px-5 py-2 rounded-lg text-sm font-medium cursor-pointer transition-colors ${
                saved
                  ? 'bg-green-50 dark:bg-green-950/40 text-green-700 dark:text-green-300 border border-green-300 dark:border-green-700'
                  : 'bg-blue-600 hover:bg-blue-700 text-white'
              }`}>
              {saved ? '✓ Enregistré' : 'Enregistrer'}
            </button>
          </div>
        </div>
      )}
    </div>
  );
}

// ─── Panel 3: Ingredient Calculator ──────────────────────────────────────────
function IngredientCalc({ recipes, plans }) {
  const [date, setDate] = useState(getTodayISO());
  const [counts, setCounts] = useState({ lunch: 0, dinner: 0 });
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState(null);
  const [error, setError] = useState('');

  useEffect(() => {
    setResult(null); setLoading(true);
    fetchReservationCounts(date).then(setCounts).finally(() => setLoading(false));
  }, [date]);

  const plan = plans[date];

  const handleCalc = () => {
    if (!plan || !plan.lunchMain || !plan.dinnerMain) {
      setError("Aucun menu planifié pour cette date. Configurez-le dans l'onglet Planification.");
      return;
    }
    setError('');
    const keys = [
      { key: plan.lunchMain, count: counts.lunch, mealLabel: 'Déjeuner' },
      plan.lunchSalad && { key: plan.lunchSalad, count: counts.lunch, mealLabel: 'Déjeuner' },
      plan.lunchDessert && { key: plan.lunchDessert, count: counts.lunch, mealLabel: 'Déjeuner' },
      { key: plan.dinnerMain, count: counts.dinner, mealLabel: 'Dîner' },
      plan.dinnerSalad && { key: plan.dinnerSalad, count: counts.dinner, mealLabel: 'Dîner' },
      plan.dinnerDessert && { key: plan.dinnerDessert, count: counts.dinner, mealLabel: 'Dîner' },
    ].filter(Boolean);
    setResult(aggregateIngredients(keys, recipes));
  };

  const maxQty = result && result.length ? Math.max(...result.map(i => i.total)) : 1;
  const total = counts.lunch + counts.dinner;

  return (
    <div>
      {/* Header row */}
      <div className="flex flex-wrap items-end gap-4 mb-5">
        <div>
          <label className="block text-xs font-medium text-gray-500 dark:text-gray-400 mb-1">Date de service</label>
          <input type="date" value={date} onChange={e => { setDate(e.target.value); setResult(null); }}
            className="px-3 py-2 text-sm border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-800 text-gray-900 dark:text-gray-100 focus:outline-none focus:ring-2 focus:ring-blue-500" />
        </div>
        <div className="flex gap-3">
          <StatPill label="Déjeuners" value={loading ? '…' : counts.lunch} colorClass="bg-orange-50 dark:bg-orange-950/30 text-orange-700 dark:text-orange-300" />
          <StatPill label="Dîners" value={loading ? '…' : counts.dinner} colorClass="bg-purple-50 dark:bg-purple-950/30 text-purple-700 dark:text-purple-300" />
          <StatPill label="Total" value={loading ? '…' : total} colorClass="bg-blue-50 dark:bg-blue-950/30 text-blue-700 dark:text-blue-300" />
        </div>
      </div>

      {/* Plan recap */}
      {plan && plan.lunchMain ? (
        <div className="bg-gray-50 dark:bg-gray-800/50 border border-gray-200 dark:border-gray-700 rounded-xl px-4 py-3 mb-4">
          <p className="text-xs uppercase tracking-wider text-gray-400 dark:text-gray-500 mb-3">Menu planifié</p>
          <div className="grid grid-cols-2 gap-4">
            <div>
              <p className="text-xs font-medium text-orange-600 dark:text-orange-400 mb-1.5"> Déjeuner · {counts.lunch} couverts</p>
              {[plan.lunchMain, plan.lunchSalad, plan.lunchDessert].filter(Boolean).map(k => (
                <p key={k} className="text-sm text-gray-700 dark:text-gray-300 mb-0.5">{recipes[k]?.label || k}</p>
              ))}
            </div>
            <div>
              <p className="text-xs font-medium text-purple-600 dark:text-purple-400 mb-1.5"> Dîner · {counts.dinner} couverts</p>
              {[plan.dinnerMain, plan.dinnerSalad, plan.dinnerDessert].filter(Boolean).map(k => (
                <p key={k} className="text-sm text-gray-700 dark:text-gray-300 mb-0.5">{recipes[k]?.label || k}</p>
              ))}
            </div>
          </div>
        </div>
      ) : (
        <div className="bg-amber-50 dark:bg-amber-950/30 border border-amber-200 dark:border-amber-800 rounded-xl px-4 py-3 mb-4">
          <p className="text-sm text-amber-700 dark:text-amber-300">
             Aucun menu planifié pour le <span className="font-medium capitalize">{formatDateFR(date)}</span>.
            Ajoutez-en un dans l'onglet Planification.
          </p>
        </div>
      )}

      {error && (
        <p className="text-sm text-red-600 dark:text-red-400 bg-red-50 dark:bg-red-950/40 border border-red-200 dark:border-red-800 rounded-lg px-4 py-2 mb-4">
          {error}
        </p>
      )}

      <button onClick={handleCalc}
        className="px-6 py-2.5 bg-blue-600 hover:bg-blue-700 text-white rounded-lg text-sm font-medium transition-colors mb-6 cursor-pointer">
        Calculer les ingrédients →
      </button>

      {result && (
        <div className="rounded-xl border border-gray-200 dark:border-gray-700 overflow-hidden">
          <div className="px-5 py-3 bg-gray-50 dark:bg-gray-800/50 border-b border-gray-200 dark:border-gray-700 flex items-center justify-between">
            <h3 className="text-xs font-semibold uppercase tracking-wider text-gray-500 dark:text-gray-400">
              Liste des ingrédients à préparer
            </h3>
            <span className="text-xs text-gray-400 dark:text-gray-500">{result.length} ingrédients · {total} couverts</span>
          </div>
          <div className="overflow-x-auto">
            <table className="min-w-full divide-y divide-gray-200 dark:divide-gray-700">
              <thead className="bg-gray-50 dark:bg-gray-800/50">
                <tr>
                  {['Ingrédient', 'Quantité totale', 'Proportion', 'Repas'].map(h => (
                    <th key={h} className="px-5 py-2.5 text-left text-xs font-semibold uppercase tracking-wider text-gray-500 dark:text-gray-400">{h}</th>
                  ))}
                </tr>
              </thead>
              <tbody className="bg-white dark:bg-gray-900 divide-y divide-gray-200 dark:divide-gray-700">
                {result.map((ing) => {
                  const pct = Math.round((ing.total / maxQty) * 100);
                  return (
                    <tr key={`${ing.name}|${ing.unit}`} className="hover:bg-gray-50 dark:hover:bg-gray-800/50 transition-colors">
                      <td className="px-5 py-3 text-sm font-medium text-gray-900 dark:text-white">{ing.name}</td>
                      <td className="px-5 py-3">
                        <span className="text-base font-semibold text-blue-600 dark:text-blue-400">{formatQty(ing.total, ing.unit)}</span>
                      </td>
                      <td className="px-5 py-3 w-36">
                        <div className="w-full bg-gray-100 dark:bg-gray-700 rounded-full h-1.5">
                          <div className="bg-blue-500 dark:bg-blue-400 h-1.5 rounded-full transition-all duration-500" style={{ width: `${pct}%` }} />
                        </div>
                      </td>
                      <td className="px-5 py-3">
                        <div className="flex flex-wrap gap-1">
                          {ing.sources.map(s => (
                            <span key={s} className={`inline-flex px-2 py-0.5 text-xs font-medium rounded-full ${
                              s === 'Déjeuner'
                                ? 'bg-orange-100 dark:bg-orange-950/40 text-orange-700 dark:text-orange-300'
                                : 'bg-purple-100 dark:bg-purple-950/40 text-purple-700 dark:text-purple-300'
                            }`}>{s}</span>
                          ))}
                        </div>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </div>
      )}
    </div>
  );
}

function StatPill({ label, value, colorClass }) {
  return (
    <div className={`rounded-xl px-4 py-2 text-center min-w-[72px] ${colorClass}`}>
      <p className="text-xl font-semibold leading-none">{value}</p>
      <p className="text-xs mt-1 opacity-80">{label}</p>
    </div>
  );
}

// ─── Root ─────────────────────────────────────────────────────────────────────
export default function KitchenAdmin() {
  const [tab, setTab] = useState('create');
  const [recipes, setRecipes] = useState<Record<string, Recipe>>({});
  const [plans, setPlans] = useState({});
  const [ready, setReady] = useState(false);

  useEffect(() => {
    (async () => {
      try {
        // Load recipes from backend
        const recipesData = await recipeService.getAllRecipes();
        const recipesMap = recipesData.reduce((acc, recipe) => {
          acc[recipe.id!] = recipe;
          return acc;
        }, {} as Record<string, Recipe>);
        setRecipes(recipesMap);

        // Load meal plans from localStorage
        const savedPlans = await storageGet('meal-plans');
        if (savedPlans) setPlans(savedPlans);
      } catch (error) {
        console.error('Failed to load recipes:', error);
      } finally {
        setReady(true);
      }
    })();
  }, []);

  if (!ready) return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-950 flex items-center justify-center">
      <p className="text-sm text-gray-400">Chargement…</p>
    </div>
  );

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-950 transition-colors">
      {/* Header */}
      <div className="bg-white dark:bg-gray-900 shadow-sm border-b border-gray-200 dark:border-gray-700">
        <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center h-16">
            <div>
              <h1 className="text-lg font-bold text-gray-900 dark:text-white">Planification cuisine</h1>
              <p className="text-xs text-gray-500 dark:text-gray-400">Administration des menus et calcul des ingrédients</p>
            </div>
          </div>
        </div>
      </div>

      <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
        {/* Tab bar */}
        <div className="flex border-b border-gray-200 dark:border-gray-700 mb-6">
          {TABS.map(t => (
            <button key={t.id} onClick={() => setTab(t.id)}
              className={`px-5 py-3 text-sm font-medium border-b-2 transition-colors cursor-pointer -mb-px ${
                tab === t.id
                  ? 'border-blue-600 text-blue-600 dark:text-blue-400 dark:border-blue-400'
                  : 'border-transparent text-gray-500 dark:text-gray-400 hover:text-gray-700 dark:hover:text-gray-300 hover:border-gray-300 dark:hover:border-gray-600'
              }`}>
              <span className="mr-1.5">{t.icon}</span>{t.label}
            </button>
          ))}
        </div>

        {/* Panel container */}
        <div className="bg-white dark:bg-gray-900 rounded-2xl shadow-sm border border-gray-200 dark:border-gray-700 p-6">
          {tab === 'create' && <MenuCreator recipes={recipes} setRecipes={setRecipes} />}
          {tab === 'plan' && <Planning recipes={recipes} plans={plans} setPlans={setPlans} />}
          {tab === 'ingredients' && <IngredientCalc recipes={recipes} plans={plans} />}
        </div>
      </div>
    </div>
  );
}