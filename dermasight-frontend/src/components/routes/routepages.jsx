import React, { Component } from 'react'
import { Routes, Route, Navigate } from 'react-router-dom'
import HomePage from '../homepage/homepage'

const RoutePages = () => {
  return (
    <Routes>
      <Route path="/" element={<HomePage />}/>
      <Route
        path="*"
        element={
          <div>
            <h2>404 Page not found etc</h2>
          </div>
        }/>
    </Routes>
  )
}

export default RoutePages;