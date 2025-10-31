import React from 'react';
import ReactDOM from 'react-dom/client';
import App from './App';
import { AuthProvider, useAuth } from './auth/AuthContext';
import LoginPage from './components/LoginPage';

const rootElement = document.getElementById('root');
if (!rootElement) {
  throw new Error("Could not find root element to mount to");
}

const AppContainer: React.FC = () => {
    const { user } = useAuth();
    return user ? <App /> : <LoginPage />;
};

const root = ReactDOM.createRoot(rootElement);
root.render(
  <React.StrictMode>
    <AuthProvider>
        <AppContainer />
    </AuthProvider>
  </React.StrictMode>
);
