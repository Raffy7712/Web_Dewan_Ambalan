// Default avatar utility
// Uses static placeholder from public folder

export function getAvatarUrl(profilePictureUrl) {
  if (profilePictureUrl && profilePictureUrl.trim()) {
    return profilePictureUrl;
  }
  return "/default-avatar.jpg";
}

// Generate initials for fallback display
export function getInitials(name) {
  if (!name) return "?";
  const parts = name.trim().split(" ");
  if (parts.length >= 2) {
    return (parts[0][0] + parts[parts.length - 1][0]).toUpperCase();
  }
  return name.slice(0, 2).toUpperCase();
}
