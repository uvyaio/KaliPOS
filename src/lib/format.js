// Small formatting helpers used throughout the app.

export function formatKsh(amount) {
  const value = Number(amount) || 0;
  return "KSh " + value.toLocaleString("en-KE", { maximumFractionDigits: 0 });
}

export function formatKshWithCents(amount) {
  const value = Number(amount) || 0;
  return "KSh " + value.toLocaleString("en-KE", { minimumFractionDigits: 2, maximumFractionDigits: 2 });
}

export function formatTime(dateString) {
  if (!dateString) return "";
  return new Date(dateString).toLocaleTimeString("en-KE", { hour: "2-digit", minute: "2-digit", second: "2-digit" });
}

export function formatDate(dateString) {
  if (!dateString) return "";
  return new Date(dateString).toLocaleDateString("en-KE", { month: "short", day: "numeric", year: "numeric" });
}

export function relativeTime(dateString) {
  if (!dateString) return "";
  const seconds = Math.floor((Date.now() - new Date(dateString).getTime()) / 1000);
  if (seconds < 5) return "Just now";
  if (seconds < 60) return `${seconds}s ago`;
  const minutes = Math.floor(seconds / 60);
  if (minutes < 60) return `${minutes}m ago`;
  const hours = Math.floor(minutes / 60);
  if (hours < 24) return `${hours}h ago`;
  return formatDate(dateString);
}

// Masks a phone number for display, e.g. "254712345678" -> "254712***678"
export function maskPhone(phone) {
  if (!phone || phone.length < 6) return phone;
  return phone.slice(0, 6) + "***" + phone.slice(-3);
}

// Generates initials from a full name, e.g. "Sarah Njoroge" -> "SN"
export function initials(name) {
  if (!name) return "?";
  return name
    .split(" ")
    .filter(Boolean)
    .slice(0, 2)
    .map((p) => p[0].toUpperCase())
    .join("");
}
