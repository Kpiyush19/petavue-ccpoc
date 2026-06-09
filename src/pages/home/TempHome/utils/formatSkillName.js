export function formatSkillName(name) {
  if (!name) return "";
  return name
    .split("-")
    .map((word) => word.charAt(0).toUpperCase() + word.slice(1))
    .join(" ");
}
