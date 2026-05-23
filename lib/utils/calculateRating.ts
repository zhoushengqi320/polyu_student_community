export function calculateAverageRating(ratings: number[]): number | null {
  if (ratings.length === 0) {
    return null;
  }

  const sum = ratings.reduce((total, rating) => total + rating, 0);
  return Math.round((sum / ratings.length) * 10) / 10;
}

export function calculateRatingDistribution(
  ratings: number[],
  max = 5,
): Record<number, number> {
  const distribution: Record<number, number> = {};

  for (let score = 1; score <= max; score += 1) {
    distribution[score] = 0;
  }

  for (const rating of ratings) {
    const rounded = Math.min(max, Math.max(1, Math.round(rating)));
    distribution[rounded] += 1;
  }

  return distribution;
}
