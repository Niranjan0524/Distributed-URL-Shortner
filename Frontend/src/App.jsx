import { useState } from 'react'
import reactLogo from './assets/react.svg'
import viteLogo from '/vite.svg'
import './App.css'
import Header from './components/Header.jsx'


function App() {
 

  return (
    <>
      <Header />
     <div className="flex flex-col items-center justify-center min-h-screen bg-gray-100 text-gray-800 text-2xl font-bold">
       Welcome to URL Shortner Service!
     </div>
    </>
  )
}

export default App;
