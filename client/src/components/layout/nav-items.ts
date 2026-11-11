import { House, Inbox, List, SlidersHorizontal, Upload, type LucideIcon } from 'lucide-react'

export interface NavItem {
  to: string
  label: string
  /** Omitted for the account tab, which shows the user's avatar instead. */
  icon?: LucideIcon
  badge?: 'review'
  /** Where the item appears. Phones have 5 slots; Rules lives inside Account there. */
  in: ('bottom' | 'sidebar')[]
}

export const navItems: NavItem[] = [
  { to: '/', label: 'Home', icon: House, in: ['bottom', 'sidebar'] },
  { to: '/import', label: 'Import', icon: Upload, in: ['bottom', 'sidebar'] },
  { to: '/review', label: 'Review', icon: Inbox, badge: 'review', in: ['bottom', 'sidebar'] },
  { to: '/transactions', label: 'Transactions', icon: List, in: ['bottom', 'sidebar'] },
  { to: '/rules', label: 'Rules', icon: SlidersHorizontal, in: ['sidebar'] },
  { to: '/account', label: 'Account', in: ['bottom'] },
]
