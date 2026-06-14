import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function main() {
  console.log('Seeding default recipes...');

  const defaultRecipes = [
    {
      label: 'Couscous',
      type: 'MAIN',
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
    {
      label: 'Spaghetti bolognaise',
      type: 'MAIN',
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
    {
      label: 'Tajine poulet',
      type: 'MAIN',
      ingredients: [
        { name: 'Poulet', qty: 250, unit: 'g' },
        { name: 'Oignons', qty: 80, unit: 'g' },
        { name: 'Citron confit', qty: 30, unit: 'g' },
        { name: 'Olives', qty: 40, unit: 'g' },
        { name: 'Ras el hanout', qty: 8, unit: 'g' },
        { name: "Huile d'olive", qty: 20, unit: 'ml' },
      ],
    },
    {
      label: 'Grillades mixtes',
      type: 'MAIN',
      ingredients: [
        { name: 'Viande de bœuf', qty: 150, unit: 'g' },
        { name: 'Merguez', qty: 80, unit: 'g' },
        { name: 'Poulet mariné', qty: 100, unit: 'g' },
        { name: 'Marinade (herbes)', qty: 20, unit: 'g' },
        { name: 'Huile végétale', qty: 15, unit: 'ml' },
      ],
    },
    {
      label: 'Poisson grillé',
      type: 'MAIN',
      ingredients: [
        { name: 'Filet de poisson', qty: 200, unit: 'g' },
        { name: 'Citron', qty: 30, unit: 'g' },
        { name: 'Ail', qty: 8, unit: 'g' },
        { name: 'Persil', qty: 10, unit: 'g' },
        { name: "Huile d'olive", qty: 15, unit: 'ml' },
      ],
    },
    {
      label: 'Salade verte',
      type: 'SALAD',
      ingredients: [
        { name: 'Laitue', qty: 60, unit: 'g' },
        { name: 'Tomates', qty: 50, unit: 'g' },
        { name: 'Concombre', qty: 40, unit: 'g' },
        { name: 'Vinaigrette', qty: 20, unit: 'ml' },
      ],
    },
    {
      label: 'Salade niçoise',
      type: 'SALAD',
      ingredients: [
        { name: 'Laitue', qty: 50, unit: 'g' },
        { name: 'Thon en boîte', qty: 60, unit: 'g' },
        { name: 'Œufs durs', qty: 1, unit: 'pcs' },
        { name: 'Tomates', qty: 60, unit: 'g' },
        { name: 'Olives noires', qty: 20, unit: 'g' },
        { name: 'Haricots verts', qty: 40, unit: 'g' },
      ],
    },
    {
      label: 'Taboulé',
      type: 'SALAD',
      ingredients: [
        { name: 'Boulgour', qty: 60, unit: 'g' },
        { name: 'Persil', qty: 30, unit: 'g' },
        { name: 'Menthe', qty: 10, unit: 'g' },
        { name: 'Tomates', qty: 60, unit: 'g' },
        { name: 'Jus de citron', qty: 20, unit: 'ml' },
      ],
    },
    {
      label: 'Fattoush',
      type: 'SALAD',
      ingredients: [
        { name: 'Laitue romaine', qty: 60, unit: 'g' },
        { name: 'Tomates', qty: 50, unit: 'g' },
        { name: 'Radis', qty: 30, unit: 'g' },
        { name: 'Pain pita grillé', qty: 25, unit: 'g' },
        { name: 'Sumac', qty: 5, unit: 'g' },
      ],
    },
    {
      label: 'Fruits de saison',
      type: 'DESSERT',
      ingredients: [{ name: 'Fruits assortis', qty: 150, unit: 'g' }],
    },
    {
      label: 'Yaourt nature',
      type: 'DESSERT',
      ingredients: [{ name: 'Yaourt nature', qty: 125, unit: 'g' }],
    },
    {
      label: 'Crème caramel',
      type: 'DESSERT',
      ingredients: [
        { name: 'Œufs', qty: 1, unit: 'pcs' },
        { name: 'Lait entier', qty: 120, unit: 'ml' },
        { name: 'Sucre', qty: 40, unit: 'g' },
      ],
    },
    {
      label: 'Baklawa',
      type: 'DESSERT',
      ingredients: [
        { name: 'Pâte filo', qty: 40, unit: 'g' },
        { name: 'Miel', qty: 30, unit: 'g' },
        { name: 'Amandes', qty: 30, unit: 'g' },
        { name: 'Beurre fondu', qty: 15, unit: 'g' },
      ],
    },
  ];

  for (const recipeData of defaultRecipes) {
    const existing = await prisma.recipe.findFirst({
      where: { label: recipeData.label },
    });

    if (!existing) {
      await prisma.recipe.create({
        data: {
          label: recipeData.label,
          type: recipeData.type as any,
          ingredients: {
            create: recipeData.ingredients,
          },
        },
      });
      console.log(`Created recipe: ${recipeData.label}`);
    } else {
      console.log(`Recipe already exists: ${recipeData.label}`);
    }
  }

  console.log('Seeding completed!');
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
