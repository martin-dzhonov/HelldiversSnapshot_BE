import { BrowserRouter, Routes, Route } from "react-router-dom";
import Layout from './layout';
import ArmoryPage from './pages/ArmoryPage';
import FactionPage from './pages/FactionPage';
import StrategemPage from './pages/StrategemPage';
import AboutPage from './pages/AboutPage';


function App() {
  document.title = "Helldive.Live"

  return (
    <BrowserRouter>
      <Routes>
        <Route path="/" element={
          <Layout>
            <FactionPage />
          </Layout>
        } />
        <Route path="armory" element={
          <Layout>
            <ArmoryPage />
          </Layout>
        }>
        </Route>
        <Route path="/armory/:factionId/:itemId" element={
          <Layout>
            <StrategemPage />
          </Layout>
        }/>
        <Route path="/about" element={
          <Layout>
            <AboutPage />
          </Layout>
        }/>
      </Routes>
    </BrowserRouter>
  );
}

export default App;
