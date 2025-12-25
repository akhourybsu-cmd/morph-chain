// Christmas seasonal utilities - active only on December 25th

export const isChristmas = (): boolean => {
  const today = new Date();
  return today.getMonth() === 11 && today.getDate() === 25; // December 25
};

// For testing, you can temporarily override:
// export const isChristmas = () => true;
