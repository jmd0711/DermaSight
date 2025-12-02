import { Outlet, Navigate } from "react-router-dom"

const PrivateRoutes = () => {
  return (
    localStorage.token ? <Outlet/> : <Navigate to="/login"/>
  )
}

export default PrivateRoutes