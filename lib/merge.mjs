const MISSING = Symbol("missing");

export function mergeText(base, local, incoming) {
  if (local === base) return { clean: true, value: incoming };
  if (incoming === base || local === incoming) return { clean: true, value: local };

  const baseLines = base.split("\n");
  const localHunks = diffHunks(baseLines, local.split("\n"));
  const incomingHunks = diffHunks(baseLines, incoming.split("\n"));
  const conflicts = [];

  for (const localHunk of localHunks) {
    for (const incomingHunk of incomingHunks) {
      if (sameHunk(localHunk, incomingHunk)) continue;
      if (hunksOverlap(localHunk, incomingHunk)) {
        conflicts.push({ local: localHunk, incoming: incomingHunk });
      }
    }
  }

  if (conflicts.length > 0) {
    return { clean: false, conflicts };
  }

  const combined = [...localHunks];
  for (const hunk of incomingHunks) {
    if (!combined.some((candidate) => sameHunk(candidate, hunk))) combined.push(hunk);
  }

  combined.sort((left, right) => right.start - left.start || right.end - left.end);
  const result = [...baseLines];
  for (const hunk of combined) {
    result.splice(hunk.start, hunk.end - hunk.start, ...hunk.replacement);
  }

  return { clean: true, value: result.join("\n") };
}

export function mergeJson(baseSource, localSource, incomingSource) {
  try {
    const conflicts = [];
    const value = mergeJsonValue(
      JSON.parse(baseSource),
      JSON.parse(localSource),
      JSON.parse(incomingSource),
      [],
      conflicts,
    );

    if (conflicts.length > 0) return { clean: false, conflicts };
    return { clean: true, value: `${JSON.stringify(value, null, 2)}\n` };
  } catch (error) {
    return { clean: false, conflicts: [{ path: "$", reason: error.message }] };
  }
}

function mergeJsonValue(base, local, incoming, jsonPath, conflicts) {
  if (equal(local, base)) return incoming;
  if (equal(incoming, base) || equal(local, incoming)) return local;

  if (plainObject(base) && plainObject(local) && plainObject(incoming)) {
    const result = {};
    const keys = [...new Set([...Object.keys(incoming), ...Object.keys(local), ...Object.keys(base)])];
    for (const key of keys) {
      const merged = mergeJsonValue(
        Object.hasOwn(base, key) ? base[key] : MISSING,
        Object.hasOwn(local, key) ? local[key] : MISSING,
        Object.hasOwn(incoming, key) ? incoming[key] : MISSING,
        [...jsonPath, key],
        conflicts,
      );
      if (merged !== MISSING) result[key] = merged;
    }
    return result;
  }

  conflicts.push({ path: `$.${jsonPath.join(".")}`, reason: "both sides changed" });
  return local;
}

function diffHunks(base, target) {
  const rows = Array.from({ length: base.length + 1 }, () => new Uint32Array(target.length + 1));
  for (let i = base.length - 1; i >= 0; i -= 1) {
    for (let j = target.length - 1; j >= 0; j -= 1) {
      rows[i][j] = base[i] === target[j] ? rows[i + 1][j + 1] + 1 : Math.max(rows[i + 1][j], rows[i][j + 1]);
    }
  }

  const hunks = [];
  let i = 0;
  let j = 0;
  while (i < base.length || j < target.length) {
    if (i < base.length && j < target.length && base[i] === target[j]) {
      i += 1;
      j += 1;
      continue;
    }

    const start = i;
    const replacement = [];
    while (i < base.length || j < target.length) {
      if (i < base.length && j < target.length && base[i] === target[j]) break;
      if (j < target.length && (i === base.length || rows[i][j + 1] >= rows[i + 1][j])) {
        replacement.push(target[j]);
        j += 1;
      } else {
        i += 1;
      }
    }
    hunks.push({ start, end: i, replacement });
  }
  return hunks;
}

function hunksOverlap(left, right) {
  const leftInsertion = left.start === left.end;
  const rightInsertion = right.start === right.end;
  if (leftInsertion && rightInsertion) return left.start === right.start;
  if (leftInsertion) return left.start >= right.start && left.start <= right.end;
  if (rightInsertion) return right.start >= left.start && right.start <= left.end;
  return left.start < right.end && right.start < left.end;
}

function sameHunk(left, right) {
  return left.start === right.start && left.end === right.end && equal(left.replacement, right.replacement);
}

function equal(left, right) {
  if (left === MISSING || right === MISSING) return left === right;
  return JSON.stringify(left) === JSON.stringify(right);
}

function plainObject(value) {
  return value !== MISSING && value !== null && typeof value === "object" && !Array.isArray(value);
}
