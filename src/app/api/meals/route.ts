import { NextResponse } from 'next/server';

export async function POST(req: Request) {
  try {
    const body = await req.json();
    const { title, ingredients, calories, protein, userAllergies = [] } = body;

    if (!title) {
      return NextResponse.json({ error: 'Meal title is required.' }, { status: 400 });
    }

    // Allergen check
    const content = `${title} ${ingredients || ''}`.toLowerCase();
    const matchedAllergens = userAllergies.filter((a: string) =>
      content.includes(a.toLowerCase()) || (a.toLowerCase() === 'peanuts' && content.includes('peanut'))
    );

    const hasConflict = matchedAllergens.length > 0;

    return NextResponse.json({
      success: true,
      hasConflict,
      matchedAllergens,
      warningMessage: hasConflict
        ? `Potential Allergen Conflict Detected: ${matchedAllergens.join(', ')}`
        : null,
      meal: {
        id: `meal_${Date.now()}`,
        title,
        ingredients: ingredients || '',
        calories: Number(calories) || 500,
        protein: Number(protein) || 30,
        loggedAt: new Date().toISOString(),
      },
    });
  } catch (err: unknown) {
    const errorMessage = err instanceof Error ? err.message : 'Meal logging error';
    return NextResponse.json({ error: errorMessage }, { status: 500 });
  }
}
