import React, { Suspense } from 'react';
import ReactDOM from 'react-dom/client';
import { BrowserRouter } from 'react-router-dom';
import { I18nextProvider } from 'react-i18next';
// @ts-ignore - We're using a type declaration file for i18n
import i18n from './i18n';
import App from './App';
import './index.css';
import { AuthProvider } from './context/AuthContext';
import { BranchProvider } from './context/BranchContext';

ReactDOM.createRoot(document.getElementById('root')!).render(
  <React.StrictMode>
    <BrowserRouter>
      <Suspense fallback={<div>Loading...</div>}>
        <I18nextProvider i18n={i18n}>
          <AuthProvider>
            <BranchProvider>
              <App />
            </BranchProvider>
          </AuthProvider>
        </I18nextProvider>
      </Suspense>
    </BrowserRouter>
  </React.StrictMode>,
)
