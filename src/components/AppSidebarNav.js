import React from 'react'
import { NavLink, useNavigate } from 'react-router-dom'
import PropTypes from 'prop-types'

import SimpleBar from 'simplebar-react'
import 'simplebar-react/dist/simplebar.min.css'

import { CBadge, CNavLink, CSidebarNav } from '@coreui/react'

export const AppSidebarNav = ({ items }) => {
  const navigate = useNavigate()

  const handleLogout = () => {
    localStorage.clear()
    sessionStorage.clear()
    navigate('/')
  }

  const navLink = (name, icon, badge, indent = false) => (
    <>
      {icon
        ? icon
        : indent && (
            <span className="nav-icon">
              <span className="nav-icon-bullet"></span>
            </span>
          )}
      {name}
      {badge && (
        <CBadge color={badge.color} className="ms-auto" size="sm">
          {badge.text}
        </CBadge>
      )}
    </>
  )

  const navItem = (item, index, indent = false) => {
    const { component, name, badge, icon, action, ...rest } = item
    const Component = component

    if (action === 'logout') {
      return (
        <Component as="div" key={index} className="mb-3 mt-auto">
          <CNavLink
            role="button"
            onClick={handleLogout}
            className="nav-link-custom"
            style={{ cursor: 'pointer' }}
          >
            {navLink(name, icon, badge, indent)}
          </CNavLink>
        </Component>
      )
    }

    return (
      <Component as="div" key={index} className="mb-3">
        {rest.to || rest.href ? (
          <CNavLink
            {...(rest.to && { as: NavLink })}
            {...(rest.href && { target: '_blank', rel: 'noopener noreferrer' })}
            {...rest}
            className="nav-link-custom"
          >
            {navLink(name, icon, badge, indent)}
          </CNavLink>
        ) : (
          navLink(name, icon, badge, indent)
        )}
      </Component>
    )
  }

  const navGroup = (item, index) => {
    const { component, name, icon, items, ...rest } = item
    const Component = component
    return (
      <Component compact as="div" key={index} toggler={navLink(name, icon)} {...rest} className="mb-4">
        {items?.map((child, idx) =>
          child.items ? navGroup(child, idx) : navItem(child, idx, true),
        )}
      </Component>
    )
  }

  const mainNavItems = items.filter((item) => item.action !== 'logout')
  const logoutItem = items.find((item) => item.action === 'logout')

  return (
    <CSidebarNav as={SimpleBar} className="d-flex flex-column h-100">
      <div className="flex-grow-1">
        {mainNavItems.map((item, index) =>
          item.items ? navGroup(item, index) : navItem(item, index),
        )}
      </div>

      {/* Sticky logout button */}
      {logoutItem && (
        <div className="border-top pt-3">
          {navItem(logoutItem, 'logout')}
        </div>
      )}
    </CSidebarNav>
  )
}

AppSidebarNav.propTypes = {
  items: PropTypes.arrayOf(PropTypes.any).isRequired,
}
