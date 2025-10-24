import { useState } from 'react'
import reactLogo from './assets/react.svg'
import viteLogo from '/vite.svg'
import './App.css'
import { GeoCrudForm } from './compoment/GeoCrudForm'

function App() {
  const [count, setCount] = useState(0)

  return (
    <GeoCrudForm/>
  )
}

export default App
