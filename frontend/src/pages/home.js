import React, { useState, useEffect } from 'react';
import { onAuthStateChanged, getAuth } from "firebase/auth";
import { auth } from '../firebase';
import { EafLinking } from './eaf';
import { Outlet, Link, useNavigate } from 'react-router-dom';

// Simple Typewriter component
function Typewriter({ texts, typingSpeed = 150, pauseDuration = 2000 }) {
  const [currentText, setCurrentText] = useState('');
  const [currentIndex, setCurrentIndex] = useState(0);
  const [isDeleting, setIsDeleting] = useState(false);
  const [charIndex, setCharIndex] = useState(0);

  useEffect(() => {
    let timer;
    const fullText = texts[currentIndex];
    if (!isDeleting) {
      // Typing
      if (charIndex < fullText.length) {
        timer = setTimeout(() => {
          setCurrentText(fullText.substring(0, charIndex + 1));
          setCharIndex(charIndex + 1);
        }, typingSpeed);
      } else {
        timer = setTimeout(() => {
          setIsDeleting(true);
        }, pauseDuration);
      }
    } else {
      // Deleting
      if (charIndex > 0) {
        timer = setTimeout(() => {
          setCurrentText(fullText.substring(0, charIndex - 1));
          setCharIndex(charIndex - 1);
        }, typingSpeed / 2);
      } else {
        setIsDeleting(false);
        setCurrentIndex((prev) => (prev + 1) % texts.length);
      }
    }
    return () => clearTimeout(timer);
  }, [charIndex, isDeleting, texts, currentIndex, typingSpeed, pauseDuration]);

  return (
    <span className="inline-block border-r-2 border-white animate-blink">
      {currentText}
    </span>
  );
}


function Linking(props) {
  const selectedStyle = 'bg-white text-black rounded p-2';
  let homeStr, loginStr, signupStr;
  homeStr = loginStr = signupStr = 'hover:bg-slate-300 hover:text-black hover:rounded p-2';

  switch (props.selected) {
    case 'home':
      homeStr = selectedStyle;
      break;
    case 'login':
      loginStr = selectedStyle;
      break;
    case 'signup':
      signupStr = selectedStyle;
      break;
    default:
      break;
  }

  return (
    <nav className="bg-blue-900 text-white fixed w-full z-20 top-0">
      <div className="flex justify-between items-center p-2">
        <ul className="flex items-center space-x-4">
          <li className={homeStr}>
            <Link to="/">Home</Link>
          </li>
          <li className={loginStr}>
            <Link to="/login">Login</Link>
          </li>
          <li className={signupStr}>
            <Link to="/signup">Sign Up</Link>
          </li>
        </ul>
      </div>
    </nav>
  );
}

function Home() {
  const [links, setLinks] = useState(<Linking selected='home' />);
  const navigate = useNavigate();
  const authInstance = getAuth();
  const user = authInstance.currentUser;

  useEffect(() => {
    onAuthStateChanged(authInstance, (user) => {
      if (user) {
        setLinks(<EafLinking user={user} nav={navigate} selected='home' />);
      }
    });
  }, [authInstance, navigate]);

  // Customize the typewriter texts as needed
  const typewriterTexts = [
    "emergency situations",
    "disaster management",
    "healthcare emergencies",
    "fire safety incidents"
  ];

  return (
    <div className="relative w-full h-screen overflow-hidden">
      {/* Top Nav */}
      {links}

      {/* Background Image */}
      <img
        src={require('./background2.jpg')}
        alt="Background"
        className="absolute inset-0 w-full h-full object-cover"
      />

      {/* Gradient Overlay */}
      <div className="absolute inset-0 bg-gradient-to-r from-blue-900/60 to-blue-700/30" />

      {/* Hero Content */}
      <div className="relative z-10 flex flex-col items-center justify-center h-full text-center px-4">
        <h1 className="text-5xl md:text-6xl font-extrabold text-white mb-4 drop-shadow-md">
          Welcome to the Innomergence EAF Form Generator
        </h1>
        <p className="text-lg md:text-2xl text-white max-w-3xl mb-6 drop-shadow">
          This tool helps you speed up the EAF application process, so you can focus on saving lives.
        </p>

        <div className="flex flex-col items-center space-y-2">
          <span className="text-white text-xl md:text-2xl">
            Generate an EAF form for <Typewriter texts={typewriterTexts} />
          </span>
          <button
            onClick={() => (user ? navigate('/chat') : navigate('/login'))}
            className="mt-4 bg-blue-600 hover:bg-blue-700 transition-colors text-white font-bold py-3 px-6 rounded shadow-lg"
          >
            Generate Now
          </button>
        </div>
      </div>
    </div>
  );
}

export { Home, Linking };
