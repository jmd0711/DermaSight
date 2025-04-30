import { Outlet, Navigate } from "react-router-dom"

const PrivateRoutes = () => {
  return (
    localStorage.userToken ? <Outlet/> : <Navigate to="/login"/>
  )
}

export default PrivateRoutes