import { BrowserRouter, Route, Routes } from 'react-router'
import { AppLayout } from './components/layout/AppLayout'
import { KitsPage } from './pages/KitsPage'
import { NotFoundPage } from './pages/NotFoundPage'
import { ServicesPage } from './pages/ServicesPage'
import { StyleGuide } from './pages/StyleGuide'

// Which page shows for which URL. Every page is drawn inside AppLayout (top bar + footer).
function App() {
  return (
    <BrowserRouter>
      <Routes>
        <Route element={<AppLayout />}>
          <Route index element={<ServicesPage />} />
          <Route path="facelift-kits" element={<KitsPage />} />
          <Route path="style-guide" element={<StyleGuide />} />
          <Route path="*" element={<NotFoundPage />} />
        </Route>
      </Routes>
    </BrowserRouter>
  )
}

export default App