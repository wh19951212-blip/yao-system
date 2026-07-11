import { useEffect } from 'react'
import { BrowserRouter, Navigate, Route, Routes } from 'react-router-dom'
import { AuthProvider } from '@/contexts/AuthContext'
import { SettingsProvider } from '@/contexts/SettingsContext'
import { ToastProvider } from '@/contexts/ToastContext'
import { ConfirmProvider } from '@/contexts/ConfirmContext'
import AppShell from '@/components/layout/AppShell'
import Login from '@/pages/Login'
import Dashboard from '@/pages/Dashboard'
import InvestorList from '@/pages/investors/InvestorList'
import InvestorDetail from '@/pages/investors/InvestorDetail'
import InvestorForm from '@/pages/investors/InvestorForm'
import LandList from '@/pages/lands/LandList'
import LandForm from '@/pages/lands/LandForm'
import LandCalculatorPage from '@/pages/lands/LandCalculatorPage'
import LandDetail from '@/pages/lands/LandDetail'
import PropertyList from '@/pages/properties/PropertyList'
import PropertyDetail from '@/pages/properties/PropertyDetail'
import PropertyForm from '@/pages/properties/PropertyForm'
import BuyerList from '@/pages/buyers/BuyerList'
import BuyerForm from '@/pages/buyers/BuyerForm'
import BuyerDetail from '@/pages/buyers/BuyerDetail'
import BuilderList from '@/pages/builders/BuilderList'
import BuilderForm from '@/pages/builders/BuilderForm'
import BuilderDetail from '@/pages/builders/BuilderDetail'
import HotelList from '@/pages/hotels/HotelList'
import HotelForm from '@/pages/hotels/HotelForm'
import HotelDetail from '@/pages/hotels/HotelDetail'
import HotelForecastPage from '@/pages/hotels/HotelForecastPage'
import ContractList from '@/pages/contracts/ContractList'
import ContractForm from '@/pages/contracts/ContractForm'
import MediaList from '@/pages/media/MediaList'
import MediaForm from '@/pages/media/MediaForm'
import SettingsPage from '@/pages/settings/SettingsPage'
import { appConfig } from '@/config/app'

const routerBasename =
  import.meta.env.BASE_URL.replace(/\/$/, '') || undefined

function App() {
  useEffect(() => {
    document.title = appConfig.name
  }, [])

  return (
    <AuthProvider>
      <SettingsProvider>
        <ToastProvider>
          <ConfirmProvider>
            <BrowserRouter basename={routerBasename}>
        <Routes>
          <Route path="/login" element={<Login />} />
          <Route element={<AppShell />}>
            <Route path="/" element={<Navigate to="/dashboard" replace />} />
            <Route path="/dashboard" element={<Dashboard />} />
            <Route path="/investors" element={<InvestorList />} />
            <Route path="/investors/new" element={<InvestorForm />} />
            <Route path="/investors/:id" element={<InvestorDetail />} />
            <Route path="/investors/:id/edit" element={<InvestorForm />} />
            <Route path="/lands" element={<LandList />} />
            <Route path="/lands/calculator" element={<LandCalculatorPage />} />
            <Route path="/lands/new" element={<LandForm />} />
            <Route path="/lands/:id" element={<LandDetail />} />
            <Route path="/properties" element={<PropertyList />} />
            <Route path="/properties/new" element={<PropertyForm />} />
            <Route path="/properties/:id" element={<PropertyDetail />} />
            <Route path="/properties/:id/edit" element={<PropertyForm />} />
            <Route path="/buyers" element={<BuyerList />} />
            <Route path="/buyers/new" element={<BuyerForm />} />
            <Route path="/buyers/:id" element={<BuyerDetail />} />
            <Route path="/buyers/:id/edit" element={<BuyerForm />} />
            <Route path="/builders" element={<BuilderList />} />
            <Route path="/builders/new" element={<BuilderForm />} />
            <Route path="/builders/:id" element={<BuilderDetail />} />
            <Route path="/builders/:id/edit" element={<BuilderForm />} />
            <Route path="/hotels" element={<HotelList />} />
            <Route path="/hotels/new" element={<HotelForm />} />
            <Route path="/hotels/forecast" element={<HotelForecastPage />} />
            <Route path="/hotels/:id" element={<HotelDetail />} />
            <Route path="/hotels/:id/edit" element={<HotelForm />} />
            <Route path="/contracts" element={<ContractList />} />
            <Route path="/contracts/new" element={<ContractForm />} />
            <Route path="/contracts/:id/edit" element={<ContractForm />} />
            <Route path="/media" element={<MediaList />} />
            <Route path="/media/new" element={<MediaForm />} />
            <Route path="/media/:id/edit" element={<MediaForm />} />
            <Route path="/settings" element={<SettingsPage />} />
            <Route path="/materials" element={<Navigate to="/media" replace />} />
          </Route>
          <Route path="*" element={<Navigate to="/dashboard" replace />} />
        </Routes>
            </BrowserRouter>
          </ConfirmProvider>
        </ToastProvider>
      </SettingsProvider>
    </AuthProvider>
  )
}

export default App
