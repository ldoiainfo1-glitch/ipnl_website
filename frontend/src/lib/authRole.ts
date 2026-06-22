export function getUserRole(user: any): string {
  return String(
    user?.role ||
      user?.user_metadata?.role ||
      user?.app_metadata?.role ||
      user?.raw_user_meta_data?.role ||
      '',
  ).toUpperCase();
}

export function isAdminUser(user: any): boolean {
  return getUserRole(user) === 'ADMIN';
}
