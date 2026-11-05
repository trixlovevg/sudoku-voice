import React from 'react';
import { createRoot } from 'react-dom/client';
import { App } from './App';

// StrictMode не используем: в dev-режиме он дважды монтирует компоненты,
// и ассистент создавался бы дважды (как и у преподавателя в todo-canvas-app).
createRoot(document.getElementById('root')).render(<App />);
