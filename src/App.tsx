import { lazy, Suspense, useEffect } from 'react'
import { BrowserRouter, Navigate, Route, Routes } from 'react-router-dom'
import { AuthProvider } from '@/contexts/AuthContext'
import { SettingsProvider } from '@/contexts/SettingsContext'
import { ToastProvider } from '@/contexts/ToastContext'
import { ConfirmProvider } from '@/contexts/ConfirmContext'
import AppShell from '@/components/layout/AppShell'
import LoadingSpinner from '@/components/ui/LoadingSpinner'
import { appConfig } from '@/config/app'

const Login = lazy(() => import('@/pages/Login'))
const Dashboard = lazy(() => import('@/pages/Dashboard'))
const InvestorList = lazy(() => import('@/pages/investors/InvestorList'))
const InvestorDetail = lazy(() => import('@/pages/investors/InvestorDetail'))
const InvestorForm = lazy(() => import('@/pages/investors/InvestorForm'))
const LandList = lazy(() => import('@/pages/lands/LandList'))
const LandForm = lazy(() => import('@/pages/lands/LandForm'))
const LandCalculatorPage = lazy(() => import('@/pages/lands/LandCalculatorPage'))
const LandDetail = lazy(() => import('@/pages/lands/LandDetail'))
const PropertyList = lazy(() => import('@/pages/properties/PropertyList'))
const PropertyDetail = lazy(() => import('@/pages/properties/PropertyDetail'))
const PropertyForm = lazy(() => import('@/pages/properties/PropertyForm'))
const BuyerForm = lazy(() => import('@/pages/buyers/BuyerForm'))
const BuyerDetail = lazy(() => import('@/pages/buyers/BuyerDetail'))
const ChannelList = lazy(() => import('@/pages/channels/ChannelList'))
const ChannelForm = lazy(() => import('@/pages/channels/ChannelForm'))
const ChannelDetail = lazy(() => import('@/pages/channels/ChannelDetail'))
const BuilderList = lazy(() => import('@/pages/builders/BuilderList'))
const BuilderForm = lazy(() => import('@/pages/builders/BuilderForm'))
const BuilderDetail = lazy(() => import('@/pages/builders/BuilderDetail'))
const HotelList = lazy(() => import('@/pages/hotels/HotelList'))
const HotelForm = lazy(() => import('@/pages/hotels/HotelForm'))
const HotelDetail = lazy(() => import('@/pages/hotels/HotelDetail'))
const HotelForecastPage = lazy(() => import('@/pages/hotels/HotelForecastPage'))
const ContractList = lazy(() => import('@/pages/contracts/ContractList'))
const ContractForm = lazy(() => import('@/pages/contracts/ContractForm'))
const ContractDetail = lazy(() => import('@/pages/contracts/ContractDetail'))
const ProjectList = lazy(() => import('@/pages/projects/ProjectList'))
const ProjectForm = lazy(() => import('@/pages/projects/ProjectForm'))
const ProjectDetail = lazy(() => import('@/pages/projects/ProjectDetail'))
const TaskList = lazy(() => import('@/pages/tasks/TaskList'))
const MediaList = lazy(() => import('@/pages/media/MediaList'))
const MediaForm = lazy(() => import('@/pages/media/MediaForm'))
const SettingsPage = lazy(() => import('@/pages/settings/SettingsPage'))
const DemandList = lazy(() => import('@/pages/matching/DemandList'))
const DemandForm = lazy(() => import('@/pages/matching/DemandForm'))
const DemandDetail = lazy(() => import('@/pages/matching/DemandDetail'))
const MorePage = lazy(() => import('@/pages/MorePage'))

const routerBasename =
  import.meta.env.BASE_URL.replace(/\/$/, '') || undefined

function PageLoader() {
  return (
    <div className="min-h-[40vh] flex items-center justify-center">
      <LoadingSpinner label="加载页面..." />
    </div>
  )
}

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
              <Suspense fallback={<PageLoader />}>
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
                    <Route path="/lands/:id/edit" element={<LandForm />} />
                    <Route path="/lands/:id" element={<LandDetail />} />

                    <Route path="/properties" element={<PropertyList />} />
                    <Route path="/properties/new" element={<PropertyForm />} />
                    <Route path="/properties/:id" element={<PropertyDetail />} />
                    <Route path="/properties/:id/edit" element={<PropertyForm />} />

                    <Route path="/buyers" element={<Navigate to="/investors?tab=buyers" replace />} />
                    <Route path="/buyers/new" element={<BuyerForm />} />
                    <Route path="/buyers/:id" element={<BuyerDetail />} />
                    <Route path="/buyers/:id/edit" element={<BuyerForm />} />

                    <Route path="/channels" element={<ChannelList />} />
                    <Route path="/channels/new" element={<ChannelForm />} />
                    <Route path="/channels/:id/edit" element={<ChannelForm />} />
                    <Route path="/channels/:id" element={<ChannelDetail />} />

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
                    <Route path="/contracts/:id" element={<ContractDetail />} />

                    <Route path="/tasks" element={<TaskList />} />

                    <Route path="/projects" element={<ProjectList />} />
                    <Route path="/projects/new" element={<ProjectForm />} />
                    <Route path="/projects/:id/edit" element={<ProjectForm />} />
                    <Route path="/projects/:id" element={<ProjectDetail />} />

                    <Route path="/media" element={<MediaList />} />
                    <Route path="/media/new" element={<MediaForm />} />
                    <Route path="/media/:id/edit" element={<MediaForm />} />

                    <Route path="/settings" element={<SettingsPage />} />

                    <Route path="/matching/demands" element={<DemandList />} />
                    <Route path="/matching/demands/new" element={<DemandForm />} />
                    <Route path="/matching/demands/:id" element={<DemandDetail />} />

                    <Route path="/more" element={<MorePage />} />
                    <Route path="/clients/investors" element={<Navigate to="/investors" replace />} />
                    <Route path="/clients/buyers" element={<Navigate to="/investors?tab=buyers" replace />} />
                    <Route path="/projects/lands" element={<Navigate to="/lands" replace />} />
                    <Route path="/projects/properties" element={<Navigate to="/properties" replace />} />
                    <Route path="/projects/hotels" element={<Navigate to="/hotels" replace />} />
                    <Route path="/partners/channels" element={<Navigate to="/channels" replace />} />
                    <Route path="/partners/builders" element={<Navigate to="/builders" replace />} />
                    <Route path="/materials" element={<Navigate to="/media" replace />} />
                  </Route>
                  <Route path="*" element={<Navigate to="/dashboard" replace />} />
                </Routes>
              </Suspense>
            </BrowserRouter>
          </ConfirmProvider>
        </ToastProvider>
      </SettingsProvider>
    </AuthProvider>
  )
}

export default App
