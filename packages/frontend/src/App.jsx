import React from 'react'
import MintPage from './MintPage'
import './styles/mint.css'

function App() {
  return (
    <div className="background">
      <div className="container">
        <img width="200" height="200" src="/config/images/logo-win.png" />
        <MintPage />
      </div>
    </div>
  )
}

export default App
