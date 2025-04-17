// src/App.js
import React, { useState, useEffect } from 'react';
import { auth } from './firebase';
import { Signup, Login } from './pages/login_sign_up';
import { Home } from './pages/home';
import { EafFiles, EafChat, EafSettings } from './pages/eaf';
import { BrowserRouter as Router } from 'react-router-dom';
import { Routes, Route, Navigate } from 'react-router-dom';
import { ToastContainer } from 'react-toastify';
import 'react-toastify/dist/ReactToastify.css';

const App = () => {
  // Start with undefined so you know if auth is still loading.
  const [user, setUser] = useState(undefined);

  useEffect(() => {
    const unsubscribe = auth.onAuthStateChanged((currentUser) => {
      setUser(currentUser);
    });
    return () => unsubscribe();
  }, []);

  // Show a loading indicator until auth state is determined.
  if (user === undefined) {
    return <div>Loading...</div>;
  }

  console.log(user); // Debugging purposes

  return (
    <Router>
      <div className="App">
        <Routes>
          {user ? (
            // Routes for authenticated users
            <>
              <Route path="/" element={<Home />} />
              <Route path="/user-files" element={<EafFiles userLoggedIn={user} />} />
              <Route path="/chat" element={<EafChat userLoggedIn={user} />} />
              <Route path="/settings" element={<EafSettings userLoggedIn={user} />} />
              <Route path="/login" element={<Navigate to='/user-files' />} />
              <Route path="/signup" element={<Navigate to='/user-files' />} />
            </>
          ) : (
            // Routes for unauthenticated users
            <>
              <Route path="/" element={<Home />} />
              <Route path="/login" element={<Login />} />
              <Route path="/signup" element={<Signup />} />
              <Route path="/user-files" element={<Navigate to='/' />} />
              <Route path="/chat" element={<Navigate to='/' />} />
            </>
          )}
        </Routes>
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
      </div>
    </Router>
  );
};

export default App;
