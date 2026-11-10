export type UserProfile = {
  phone: string
  name: string
  email: string
  telegramId?: string
  telegramUsername?: string
  notifications: boolean
  notificationsApp?: boolean
  notificationsTelegram?: boolean
  joinedAt: number
}
