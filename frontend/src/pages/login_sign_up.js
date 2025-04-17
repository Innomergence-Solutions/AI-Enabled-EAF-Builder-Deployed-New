import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { auth, createUserWithEmailAndPassword, signInWithEmailAndPassword } from '../firebase';
import { GoogleAuthProvider, signInWithPopup } from 'firebase/auth';
import { Linking } from './home';

async function HandleGoogleSignIn(navigate) {
    const provider = new GoogleAuthProvider();

    try {
        const result = await signInWithPopup(auth, provider);
        const user = result.user;
        navigate('/user-files');
    } catch (error) {
        console.error("Error signing in with Google");
    }
}

function Login() {
    const [email, setEmail] = useState('');
    const [password, setPassword] = useState('');
    const [error, setError] = useState('');
    const navigate = useNavigate();

    // sign in 
    const handleLogin = async (e) => {
        e.preventDefault();

        try {
            await signInWithEmailAndPassword(auth, email, password);
            setError('');
            alert('Login Successful');
            navigate('/user-files');
        } catch (err) {
            setError(err.message.split('Firebase:')[1]);
        }
    };


    return (
        <div>
            <section>
                <Linking selected='login' />
            </section>
            <div className="flex justify-center items-center h-screen bg-gray-100">
                <form className="bg-white p-6 rounded-md shadow-md w-96" onSubmit={handleLogin}>
                    <h2 className="text-2xl font-bold text-center mb-4">Login</h2>
                    {error && <p className="text-red-500 text-center mb-4">{error}</p>}
                    <div className="mb-4">
                        <label htmlFor="email" className="block text-gray-700">Email</label>
                        <input
                            type="email"
                            id="email"
                            value={email}
                            onChange={(e) => setEmail(e.target.value)}
                            className="w-full p-2 border border-gray-300 rounded mt-2"
                            required
                        />
                    </div>
                    <div className="mb-4">
                        <label htmlFor="password" className="block text-gray-700">Password</label>
                        <input
                            type="password"
                            id="password"
                            value={password}
                            onChange={(e) => setPassword(e.target.value)}
                            className="w-full p-2 border border-gray-300 rounded mt-2"
                            required
                        />
                    </div>
                    <button type="submit" className="w-full border border-width: 4px border-blue-500 bg-white text-black p-2 rounded-md hover:bg-blue-500 hover:text-white">Login</button>
                    <button className='w-full bg-white text-black p-2 mt-2 border border-width: 4px border-black rounded-md hover:bg-gray-700 hover:text-white' onClick={() => HandleGoogleSignIn(navigate)}> Sign In with Google </button>
                </form>
            </div>
        </div>
    );
};

function Signup() {
    const [email, setEmail] = useState('');
    const [password, setPassword] = useState('');
    const [repeatPassword, setRepeatPassword] = useState('');
    const [error, setError] = useState('');
    const navigate = useNavigate();

    const handleSignup = async (e) => {
        e.preventDefault();

        const passwordRegEx = /^(?=.*[A-Za-z])(?=.*\d)(?=.*[@$!%*#?&])[A-Za-z\d@$!%*#?&]{8,}$/;
        const passwordMinLngth = 8;
        const passwordMaxLngth = 16;

        let issueOccured = false;

        if (repeatPassword !== password) {
            setError('* Passwords must match.');
            issueOccured = true;
        } 
        else if (email === '' || password === '' || repeatPassword === '') {
            setError('* All values must be filled in.');
            issueOccured = true;
        }
        else if (password.length <= passwordMinLngth || password.length > passwordMaxLngth) {
            setError('* Password must be between 8 and 16 characters.');
            issueOccured = true;
        }
        else if (!passwordRegEx.test(password)) {
            setError('* Password must have at least 1 uppercase letter, 1 lowercase letter, 1 number, and 1 special character.');
            issueOccured = true;
        }

        if (issueOccured) {
            setPassword('');
            setRepeatPassword('');
        }

        if (!issueOccured) {
            try {
                await createUserWithEmailAndPassword(auth, email, password);
                setError('');
                alert('Signup Successful');
            } catch (err) {
                setError('* ' + err.message.split('Firebase:')[1]);
                setPassword('');
                setRepeatPassword('');
            }
        }
    };

    return (
        <div>
            <section>
            </section>
            <Linking selected='signup' />

            <div className="flex justify-center items-center h-screen bg-gray-100">
                <form className="bg-white p-6 rounded-md shadow-md w-96" onSubmit={handleSignup}>
                    <h2 className="text-2xl font-bold text-center mb-4">Sign Up</h2>
                    {error && <p className="text-red-500 text-center mb-4">{error}</p>}
                    <div className="mb-4">
                        <label htmlFor="email" className="block text-gray-700">Email</label>
                        <input
                            type="email"
                            id="email"
                            value={email}
                            onChange={(e) => setEmail(e.target.value)}
                            className="w-full p-2 border border-gray-300 rounded mt-2"
                            required
                        />
                    </div>
                    <div className="mb-4">
                        <label htmlFor="password" className="block text-gray-700">Password</label>
                        <input
                            type="password"
                            id="password"
                            value={password}
                            onChange={(e) => setPassword(e.target.value)}
                            className="w-full p-2 border border-gray-300 rounded mt-2"
                            required
                        />
                    </div>
                    <div className="mb-4">
                        <label htmlFor="passwordRepeat" className="block text-gray-700">Repeat Password</label>
                        <input
                            type="password"
                            id="passwordRepeat"
                            value={repeatPassword}
                            onChange={(e) => setRepeatPassword(e.target.value)}
                            className="w-full p-2 border border-gray-300 rounded mt-2"
                            required
                        />
                    </div>
                    <button type="submit" className="w-full border border-width: 4px border-blue-500 bg-white text-black p-2 rounded-md hover:bg-blue-500 hover:text-white">Sign Up</button>
                    <button className='w-full bg-white text-black p-2 mt-2 border border-width: 4px border-black rounded-md hover:bg-gray-700 hover:text-white' onClick={() => HandleGoogleSignIn(navigate)}> Sign In with Google </button>
                </form>
            </div>
        </div>
    );
};

// Named exports
export { Login, Signup };
