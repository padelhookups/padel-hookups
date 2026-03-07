export const getRoundLabel = (roundNumber, totalRounds) => {
  if (
    !Number.isInteger(roundNumber) ||
    !Number.isInteger(totalRounds) ||
    roundNumber < 1 ||
    totalRounds < 1 ||
    roundNumber > totalRounds ||
    totalRounds > 5
  ) {
    return null;
  }

  const roundsFromFinal = totalRounds - roundNumber + 1;

  if (roundsFromFinal === 1) return "Final";
  if (roundsFromFinal === 2) return "Semifinals";
  if (roundsFromFinal === 3) return "Quarterfinals";
  if (roundsFromFinal === 4) return "Round of 16";
  if (roundsFromFinal === 5) return "Round of 32";

  return null;
};
