import { QueryClient, QueryClientProvider } from '@tanstack/react-query'
import { BrowserRouter, Route, Routes } from 'react-router'
import { RequireRole } from './auth/RequireRole'
import { AppLayout } from './components/layout/AppLayout'
import { BookPage } from './pages/BookPage'
import { KitsPage } from './pages/KitsPage'
import { LoginPage } from './pages/LoginPage'
import { MyCarsPage } from './pages/MyCarsPage'
import { MyGaragePage } from './pages/MyGaragePage'
import { NotFoundPage } from './pages/NotFoundPage'
import { ServicesPage } from './pages/ServicesPage'
import { SignupPage } from './pages/SignupPage'
import { StyleGuide } from './pages/StyleGuide'

// One cache for all server data. Data counts as fresh for 1 minute; a failed request is retried once.
const queryClient = new QueryClient({
  defaultOptions: {
    queries: { staleTime: 60_000, retry: 1 },
  },
})

// Which page shows for which URL. Every page is drawn inside AppLayout (top bar + footer).
function App() {
  return (
    <QueryClientProvider client={queryClient}>
      <BrowserRouter>
        <Routes>
          <Route element={<AppLayout />}>
            <Route index element={<ServicesPage />} />
            <Route path="facelift-kits" element={<KitsPage />} />
            <Route path="login" element={<LoginPage />} />
            <Route path="signup" element={<SignupPage />} />
            <Route path="style-guide" element={<StyleGuide />} />

            {/* Customers only */}
            <Route element={<RequireRole role="CUSTOMER" />}>
              <Route path="my" element={<MyGaragePage />} />
              <Route path="book" element={<BookPage />} />
              <Route path="my/cars" element={<MyCarsPage />} />
            </Route>

            <Route path="*" element={<NotFoundPage />} />
          </Route>
        </Routes>
      </BrowserRouter>
    </QueryClientProvider>
  )
}

export default App