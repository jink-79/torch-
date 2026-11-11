import { House, Inbox, List, SlidersHorizontal, Upload, type LucideIcon } from 'lucide-react'

export interface NavItem {
  to: string
  label: string
  /** Omitted for the account tab, which shows the user's avatar instead. */
  icon?: LucideIcon
  badge?: 'review'
  /** Where the item appears. Phones have 5 slots: Home, Review, Transactions, Rules, Account. */
  in: ('bottom' | 'sidebar')[]
}

export const navItems: NavItem[] = [
  { to: '/', label: 'Home', icon: House, in: ['bottom', 'sidebar'] },
  // Phones reach Import from the card at the top of Home.
  { to: '/import', label: 'Import', icon: Upload, in: ['sidebar'] },
  { to: '/review', label: 'Review', icon: Inbox, badge: 'review', in: ['bottom', 'sidebar'] },
  { to: '/transactions', label: 'Transactions', icon: List, in: ['bottom', 'sidebar'] },
  { to: '/rules', label: 'Rules', icon: SlidersHorizontal, in: ['bottom', 'sidebar'] },
  { to: '/account', label: 'Account', in: ['bottom'] },
]
