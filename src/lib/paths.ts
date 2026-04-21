const SEPARATOR = "/";

export function shortenPath(path: string) {
  const normalized = path.replace(/[\\/]+/g, SEPARATOR);
  const parts = normalized.split(SEPARATOR).filter(Boolean);

  if (parts.length <= 5) return normalized;

  const tail = parts.slice(-4).join(SEPARATOR);
  const drive = normalized.match(/^[A-Za-z]:/)?.at(0);

  if (normalized.startsWith(`${SEPARATOR}${SEPARATOR}`) && parts.length > 5) {
    return `${SEPARATOR}${SEPARATOR}${parts[0]}${SEPARATOR}${parts[1]}${SEPARATOR}...${SEPARATOR}${tail}`;
  }

  if (drive) {
    return `${drive}${SEPARATOR}...${SEPARATOR}${tail}`;
  }

  if (normalized.startsWith(SEPARATOR)) {
    return `${SEPARATOR}...${SEPARATOR}${tail}`;
  }

  return `...${SEPARATOR}${tail}`;
}
