export function getUserField<T = any>(user: any, field: string): T | null {
  if (!user) return null;
  if (user && Object.prototype.hasOwnProperty.call(user, field) && user[field] !== undefined && user[field] !== null) {
    return user[field] as T;
  }
  const prefs = user.prefs || {};
  if (prefs && Object.prototype.hasOwnProperty.call(prefs, field) && prefs[field] !== undefined && prefs[field] !== null) {
    return prefs[field] as T;
  }
  return null;
}

export function getUserProfilePicId(user: any): string | null {
  return getUserField<string>(user, 'profilePicId');
}
