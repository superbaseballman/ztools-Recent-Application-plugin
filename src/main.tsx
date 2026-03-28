import React from 'react'
import ReactDOM from 'react-dom/client'
import './main.css'
import App from './App'

const root = document.getElementById('root')
if (!root) {
  document.body.innerHTML = '<div style="color:white;padding:20px;">Root element not found</div>'
} else {
  ReactDOM.createRoot(root).render( <App />)
}

