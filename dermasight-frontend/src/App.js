import { BrowserRouter } from 'react-router-dom'
import NavBar from './components/navbar'
import RoutePages from './components/routes/routepages'
import './App.css';

function App() {
  return (
    <BrowserRouter>
      <NavBar />
      <RoutePages />
    </BrowserRouter>
  );
}

export default App;
