import { createBrowserRouter, RouterProvider } from 'react-router'

import { AuthProvider } from '@/auth/AuthProvider'
import { RequireAuth } from '@/auth/RequireAuth'
import { AppShell } from '@/components/layout/AppShell'
import { PreferencesProvider } from '@/lib/preferences'
import Account from '@/pages/Account'
import Dashboard from '@/pages/Dashboard'
import Import from '@/pages/Import'
import Login from '@/pages/Login'
import Review from '@/pages/Review'
import Rules from '@/pages/Rules'
import Transactions from '@/pages/Transactions'

const router = createBrowserRouter([
  { path: '/login', element: <Login /> },
  {
    element: <RequireAuth />,
    children: [
      {
        element: <AppShell />,
        children: [
          { index: true, element: <Dashboard /> },
          { path: 'import', element: <Import /> },
          { path: 'review', element: <Review /> },
          { path: 'transactions', element: <Transactions /> },
          { path: 'rules', element: <Rules /> },
          { path: 'account', element: <Account /> },
          { path: '*', element: <Dashboard /> },
        ],
      },
    ],
  },
])

export default function App() {
  return (
    <AuthProvider>
      <PreferencesProvider>
        <RouterProvider router={router} />
      </PreferencesProvider>
    </AuthProvider>
  )
}
