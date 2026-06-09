export const humanizeName = (name, options = {}) => {
  if (!name) return options.fallback ?? "";

  let result = name
    .replace(/__c$/i, "")
    .replace(/_/g, " ")
    .replace(/([a-z])([A-Z])/g, "$1 $2")
    .replace(/\s+/g, " ")
    .trim();

  if (options.titleCase) {
    result = result.replace(/\b\w/g, (c) => c.toUpperCase());
  }

  return result;
};

export const humanizeTableName = (name) => humanizeName(name, { titleCase: true });
