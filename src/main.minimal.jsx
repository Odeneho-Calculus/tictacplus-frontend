import React from 'react';
import ReactDOM from 'react-dom/client';
import MinimalApp from './App.minimal';

// Simple minimal version to test if the memory issue is in our code
const root = ReactDOM.createRoot(document.getElementById('root'));

root.render(
    <React.StrictMode>
        <MinimalApp />
    </React.StrictMode>
);