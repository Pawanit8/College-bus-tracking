import React, { Component } from 'react'
import CIcon from '@coreui/icons-react'


import {
  cilBell,
  cilBusAlt,
  cilUser,
  cilCursor,
  cilCarAlt,
  cilAccountLogout,
  cilLocationPin,
} from '@coreui/icons'

import { CNavGroup, CNavItem, CNavTitle,} from '@coreui/react'


const _nav = [
  {
    component: CNavItem,
    name: 'Manage User',
    to: '/usertable',
    icon: <CIcon icon={cilUser} customClassName="nav-icon" />,

  },
  {
    component: CNavItem,
    name: 'Manage Driver',
    to: '/drivertable',
    icon: <CIcon icon={cilCarAlt} customClassName="nav-icon" />,
  },
  {
    component: CNavItem,
    name: 'Manage Route',
    to: '/routetable',
    icon: <CIcon icon={cilLocationPin} customClassName="nav-icon" />,
  },

  {
    component: CNavItem,
    name: 'manage Bus',
    to: '/bustable',
    icon: <CIcon icon={cilBusAlt} customClassName="nav-icon" />,
  },
 {
        component: CNavItem,
        name: 'Notification',
        icon: <CIcon icon={cilBell} customClassName="nav-icon" />,
        to: '/show-feedback',
 },

//  {
//   component: CNavItem,
//   name: 'Logout',
//   icon: <CIcon icon={cilAccountLogout} customClassName="nav-icon" />,
//   action: 'logout', // triggers handleLogout
// },
     

 
  // {
  //   component: CNavGroup,
  //   name: 'Pages',
  //   icon: <CIcon icon={cilStar} customClassName="nav-icon" />,
  //   items: [
  //     {
  //       component: CNavItem,
  //       name: 'Login',
  //       to: '/login',
  //     },
  //     {
  //       component: CNavItem,
  //       name: 'Register',
  //       to: '/register',
  //     },
  //     {
  //       component: CNavItem,
  //       name: 'Error 404',
  //       to: '/404',
  //     },
  //     {
  //       component: CNavItem,
  //       name: 'Error 500',
  //       to: '/500',
  //     },
  //   ],
  // },
  
]



export default _nav
