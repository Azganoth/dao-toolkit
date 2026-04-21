const SEPARATOR = "/";

function normalizeWindowsPathPrefix(path: string) {
  if (path.startsWith("\\\\?\\UNC\\")) {
    return `\\\\${path.slice("\\\\?\\UNC\\".length)}`;
  }

  if (path.startsWith("\\\\?\\")) {
    return path.slice("\\\\?\\".length);
  }

  return path;
}

export function shortenPath(path: string) {
  const pathWithoutPrefix = normalizeWindowsPathPrefix(path);
  const isUnc = pathWithoutPrefix.startsWith("\\\\");
  const normalizedPath = pathWithoutPrefix.replace(/[\\/]+/g, SEPARATOR);
  const normalized = isUnc ? `${SEPARATOR}${normalizedPath}` : normalizedPath;
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
