export const getRandomDeckId = (ids: string[]): string | null => {
  if (!ids.length) {
    return null;
  }

  const index = Math.floor(Math.random() * ids.length);
  return ids[index];
};
