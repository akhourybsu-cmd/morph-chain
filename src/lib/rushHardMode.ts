// Hard Mode validation: no same index twice in a row

export const diffIndex = (a: string, b: string): number | null => {
  if (a.length !== b.length) return null;
  let idx = -1;
  let diffs = 0;
  
  for (let i = 0; i < a.length; i++) {
    if (a[i] !== b[i]) {
      diffs++;
      if (diffs > 1) return null;
      idx = i;
    }
  }
  
  return diffs === 1 ? idx : null;
};

export const isValidMorphHard = (
  prev: string,
  next: string,
  lastChangedIdx: number | null
): { ok: boolean; changedIdx: number | null; reason?: string } => {
  const idx = diffIndex(prev, next);
  
  if (idx === null) {
    return { ok: false, changedIdx: null, reason: "Must change exactly one letter" };
  }
  
  if (lastChangedIdx !== null && idx === lastChangedIdx) {
    return { 
      ok: false, 
      changedIdx: idx, 
      reason: "Hard Mode: can't change the same position twice in a row" 
    };
  }
  
  return { ok: true, changedIdx: idx };
};
