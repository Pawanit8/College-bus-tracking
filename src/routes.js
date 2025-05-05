import React from 'react'
import UserTable from './UserPages/UserTable'
import EditUser from './UserPages/EditUser'

import DriverTable from './DriverPages/DriverTable'

import RouteTable from './components/BusRoute/RouteTable'
import EditDriver from './DriverPages/EditDriver'
import EditRoute from './components/BusRoute/EditRoute'
import BusTable from './components/Bus/BusTable'
import EditBus from './components/Bus/EditBus'


const Dashboard = React.lazy(() => import('./views/admindashboard/Dashboard'))
// const Typography = React.lazy(() => import('./views/theme/typography/Typography'))


// // Icons
// const CoreUIIcons = React.lazy(() => import('./views/icons/coreui-icons/CoreUIIcons'))
// const Flags = React.lazy(() => import('./views/icons/flags/Flags'))
// const Brands = React.lazy(() => import('./views/icons/brands/Brands'))

// Notifications
// const Alerts = React.lazy(() => import('./views/notifications/alerts/Alerts'))
// const Badges = React.lazy(() => import('./views/notifications/badges/Badges'))
// const Modals = React.lazy(() => import('./views/notifications/modals/Modals'))
// const Toasts = React.lazy(() => import('./views/notifications/toasts/Toasts'))


const routes = [
  { path: '/dashboard', name: 'Dashboard', element: Dashboard },
  
  
  
  { path: '/usertable', name: 'UserTable', element: UserTable },
  { path: '/edituser/:userId', name: 'EditUser', element: EditUser },
 
  { path: '/drivertable', name: 'DriverTable', element: DriverTable},
  { path: '/editDriver/:id', name: 'EditDriver', element: EditDriver },
 
  { path: '/routetable', name: 'RouteTable', element: RouteTable},
  { path: '/editRoute/:routeId', name: 'EditRoute', element: EditRoute },

  { path: '/bustable', name: 'BusTable', element: BusTable},
  { path: '/editBus/:id', name: 'EditBus', element: EditBus },
  

  

  

]

export default routes
