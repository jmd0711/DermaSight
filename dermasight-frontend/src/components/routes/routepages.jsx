import { Routes, Route } from 'react-router-dom'
import PrivateRoutes from './privateroutes'
import HomePage from '../homepage/homepage'
import About from '../about/about'
import Login from '../user/login'
import SignUp from '../user/signup'
import Upload from '../upload/upload'
import Questionnaire from '../questionnaire/questionnaire'
import Report from '../report/report'
import Profile from '../user/profile'
import useToken from '../usetoken'

const RoutePages = () => {
  const { token, setToken } = useToken()
  return (
    <Routes>
      <Route path="/" element={<HomePage />}/>
      <Route path="/about" element={<About />}/>
      <Route path="/login" element={<Login setToken={setToken} />}/>
      <Route path="/signup" element={<SignUp setToken={setToken} />}/>
      <Route element={<PrivateRoutes />}>
        <Route path="/upload" element={<Upload />}/>
        <Route path="/questionnaire" element={<Questionnaire />}/>
        <Route path="/report" element={<Report />}/>
        <Route path="/profile" element={<Profile />}/>
      </Route>
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