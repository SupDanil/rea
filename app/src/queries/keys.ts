export const queryKeys = {
  catalog: ['catalog'] as const,
  profile: ['profile'] as const,
  orders: ['orders'] as const,
  promo: (code: string) => ['promo', code] as const,
}
