export const PATH_SEPARATOR = "/";

export function normalizeWindowsPathPrefix(path: string) {
  if (path.startsWith("\\\\?\\UNC\\")) {
    return `\\\\${path.slice("\\\\?\\UNC\\".length)}`;
  }

  if (path.startsWith("\\\\?\\")) {
    return path.slice("\\\\?\\".length);
  }

  return path;
}

export function normalizePath(path: string) {
  const pathWithoutPrefix = normalizeWindowsPathPrefix(path);
  const isUnc = pathWithoutPrefix.startsWith("\\\\");
  const normalizedPath = pathWithoutPrefix.replace(/[\\/]+/g, PATH_SEPARATOR);
  const normalized = isUnc
    ? `${PATH_SEPARATOR}${normalizedPath}`
    : normalizedPath;

  if (normalized === PATH_SEPARATOR) {
    return normalized;
  }

  return normalized.replace(/\/+$/g, "");
}

export function splitPath(path: string) {
  return normalizePath(path).split(PATH_SEPARATOR).filter(Boolean);
}

export function shortenPath(path: string) {
  const normalized = normalizePath(path);
  const parts = splitPath(normalized);

  if (parts.length <= 5) return normalized;

  const tail = parts.slice(-4).join(PATH_SEPARATOR);
  const drive = normalized.match(/^[A-Za-z]:/)?.at(0);

  if (
    normalized.startsWith(`${PATH_SEPARATOR}${PATH_SEPARATOR}`) &&
    parts.length > 5
  ) {
    return `${PATH_SEPARATOR}${PATH_SEPARATOR}${parts[0]}${PATH_SEPARATOR}${parts[1]}${PATH_SEPARATOR}...${PATH_SEPARATOR}${tail}`;
  }

  if (drive) {
    return `${drive}${PATH_SEPARATOR}...${PATH_SEPARATOR}${tail}`;
  }

  if (normalized.startsWith(PATH_SEPARATOR)) {
    return `${PATH_SEPARATOR}...${PATH_SEPARATOR}${tail}`;
  }

  return `...${PATH_SEPARATOR}${tail}`;
}

export function getRelativePath(path: string, basePath: string) {
  const normalizedPath = normalizePath(path);
  const normalizedBasePath = normalizePath(basePath);
  const lowerPath = normalizedPath.toLowerCase();
  const lowerBasePath = normalizedBasePath.toLowerCase();

  if (lowerPath === lowerBasePath) {
    return "";
  }

  if (lowerPath.startsWith(`${lowerBasePath}${PATH_SEPARATOR}`)) {
    return normalizedPath.slice(normalizedBasePath.length + 1);
  }

  return normalizedPath;
}
