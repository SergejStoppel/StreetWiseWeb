import React from 'react';
import { BrowserRouter as Router, Routes, Route } from 'react-router-dom';
import { ToastContainer } from 'react-toastify';
import 'react-toastify/dist/ReactToastify.css';
import styled from 'styled-components';

import Header from './components/Header';
import Footer from './components/Footer';
import HomePage from './pages/HomePage';
import ResultsPage from './pages/ResultsPage';
import GlobalStyles from './styles/GlobalStyles';

const AppContainer = styled.div`
  min-height: 100vh;
  display: flex;
  flex-direction: column;
  background-color: #f8fafc;
`;

const MainContent = styled.main`
  flex: 1;
  padding: 0;
`;

function App() {
  return (
    <Router>
      <GlobalStyles />
      <AppContainer>
        <Header />
        <MainContent>
          <Routes>
            <Route path="/" element={<HomePage />} />
            <Route path="/results" element={<ResultsPage />} />
          </Routes>
        </MainContent>
        <Footer />
        <ToastContainer 
          position="top-right"
          autoClose={5000}
          hideProgressBar={false}
          newestOnTop={false}
          closeOnClick
          rtl={false}
          pauseOnFocusLoss
          draggable
          pauseOnHover
        />
      </AppContainer>
    </Router>
  );
}

export default App;