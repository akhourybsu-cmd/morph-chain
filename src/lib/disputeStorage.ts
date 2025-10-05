// Storage for word dispute reports

export interface WordDispute {
  word: string;
  reason: string;
  timestamp: string;
  resolved: boolean;
}

const DISPUTES_KEY = "morphchain_word_disputes";

export const loadDisputes = (): WordDispute[] => {
  try {
    const stored = localStorage.getItem(DISPUTES_KEY);
    return stored ? JSON.parse(stored) : [];
  } catch {
    return [];
  }
};

export const saveDispute = (dispute: Omit<WordDispute, "timestamp" | "resolved">): void => {
  try {
    const disputes = loadDisputes();
    const newDispute: WordDispute = {
      ...dispute,
      timestamp: new Date().toISOString(),
      resolved: false,
    };
    disputes.push(newDispute);
    localStorage.setItem(DISPUTES_KEY, JSON.stringify(disputes));
  } catch (error) {
    console.error("Failed to save dispute:", error);
  }
};

export const getDisputeCount = (): number => {
  return loadDisputes().filter(d => !d.resolved).length;
};
