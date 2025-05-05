import React, { Suspense, useEffect } from 'react'
import { Form, HashRouter, Route, Routes } from 'react-router-dom'
import { useSelector } from 'react-redux'

import { CSpinner, useColorModes } from '@coreui/react'
import './scss/style.scss'

// We use those styles to show code examples, you should remove them in your application.
import './scss/examples.scss'
import StudentDashboard from './views/pages/StudentDashboard'
import Feedback from './views/pages/feedback'
import SearchBus from './views/pages/SearchBus'
import About from './views/pages/About'
import ShowFeedback from './views/pages/Showfeedback'
import DriverDashboard from './views/pages/driverdashboard/DriverDashboard'
import SendMessage from './views/admindashboard/SendMessage'
import ShowMessage from './views/pages/driverdashboard/ShowMessage'
import ProfileUpdates from './views/pages/driverdashboard/ProfileUpdate'
import DelayedBuses from './components/Bus/DelayedBuses'
import BusTracking from './views/admindashboard/BusTracking'

// Containers
const DefaultLayout = React.lazy(() => import('./layout/DefaultLayout'))

// Pages
const Login = React.lazy(() => import('./views/pages/login/Login'))
const UserForm = React.lazy(() => import('./UserPages/UserForm'))
const Register = React.lazy(() => import('./views/pages/register/Register'))
const Page404 = React.lazy(() => import('./views/pages/page404/Page404'))
const Page500 = React.lazy(() => import('./views/pages/page500/Page500'))
// const DriverLocation = React.lazy(() => import('./views/pages/driverdashboard/DriverLocation'))

const App = () => {
  const { isColorModeSet, setColorMode } = useColorModes('coreui-free-react-admin-template-theme')
  const storedTheme = useSelector((state) => state.theme)

  useEffect(() => {
    const urlParams = new URLSearchParams(window.location.href.split('?')[1])
    const theme = urlParams.get('theme') && urlParams.get('theme').match(/^[A-Za-z0-9\s]+/)[0]
    if (theme) {
      setColorMode(theme)
    }

    if (isColorModeSet()) {
      return
    }

    setColorMode(storedTheme)
  }, []) // eslint-disable-line react-hooks/exhaustive-deps

  return (
    <HashRouter>
      <Suspense
        fallback={
          <div className="pt-3 text-center">
            <CSpinner color="primary" variant="grow" />
          </div>
        }
      >
        <Routes>
          <Route exact path="/" name="Login Page" element={<Login />} />
          <Route exact path="/register" name="Register Page" element={<Register />} />
          <Route exact path="/404" name="Page 404" element={<Page404 />} />
          <Route exact path="/500" name="Page 500" element={<Page500 />} />
          <Route exact path="/student-dashboard" name="StudentDashboard" element={<StudentDashboard />} />
          <Route exact path="/driver-dashboard" name="Driverdashboard" element={<DriverDashboard />} />
          <Route exact path="/feedback" name="DriverLocation" element={<Feedback />} />
          <Route exact path="/show-feedback" name="ShowFeedback" element={<ShowFeedback />} />
          <Route exact path="/search-bus" name="SearchBus" element={<SearchBus />} />
          <Route exact path="/about" name="About" element={<About />} />
          <Route exact path="/send-message" name="SendMessage" element={<SendMessage />} />
          <Route exact path="/show-messages" name="ShowMessage" element={<ShowMessage />} />
          <Route exact path="/update-profiles" name="ProfileUpdates" element={<ProfileUpdates />} />
          <Route exact path="/delayed-buses" name="DelayedBuses" element={<DelayedBuses />} />
          <Route exact path="/buses/:id" name="BusTracking" element={<BusTracking />} />


          <Route path="*" name="Home" element={<DefaultLayout />} />
        </Routes>
      </Suspense>
    </HashRouter>
  )
}

export default App