import { BrowserRouter, Navigate, Route, Routes } from 'react-router'
import { AuthProvider } from './auth/AuthProvider'
import { RequireAuth } from './auth/RequireAuth'
import { Header } from './components/Header'
import { ItemDetailPage } from './pages/ItemDetailPage'
import { ItemEditPage } from './pages/ItemEditPage'
import { ItemListPage } from './pages/ItemListPage'
import { ItemNewPage } from './pages/ItemNewPage'
import { LoginPage } from './pages/LoginPage'
import { NotFoundPage } from './pages/NotFoundPage'
import type { ItemType } from './types'

function itemRoutes(basePath: string, type: ItemType) {
  return (
    <Route path={basePath}>
      <Route index element={<ItemListPage type={type} />} />
      <Route path="new" element={<ItemNewPage type={type} />} />
      <Route path=":id" element={<ItemDetailPage type={type} />} />
      <Route path=":id/edit" element={<ItemEditPage type={type} />} />
    </Route>
  )
}

export default function App() {
  return (
    <BrowserRouter>
      <AuthProvider>
        <Header />
        <Routes>
          <Route path="/login" element={<LoginPage />} />
          <Route element={<RequireAuth />}>
            <Route path="/" element={<Navigate to="/books" replace />} />
            {itemRoutes('books', 'book')}
            {itemRoutes('sites', 'site')}
          </Route>
          <Route path="*" element={<NotFoundPage />} />
        </Routes>
      </AuthProvider>
    </BrowserRouter>
  )
}
