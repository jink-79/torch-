import { House, Inbox, List, SlidersHorizontal, Upload, type LucideIcon } from 'lucide-react'

export interface NavItem {
  to: string
  label: string
  icon: LucideIcon
  badge?: 'review'
}

export const navItems: NavItem[] = [
  { to: '/', label: 'Home', icon: House },
  { to: '/import', label: 'Import', icon: Upload },
  { to: '/review', label: 'Review', icon: Inbox, badge: 'review' },
  { to: '/transactions', label: 'Transactions', icon: List },
  { to: '/rules', label: 'Rules', icon: SlidersHorizontal },
]
