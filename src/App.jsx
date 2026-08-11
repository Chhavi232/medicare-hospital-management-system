import React from 'react'
import { Route, Routes } from 'react-router-dom'
import Home from './pages/Home'
import Doctors from './pages/Doctors'
import Services from './pages/Services'
import About from './pages/About'
import Contact from './pages/Contact'
import DoctorLogin from './pages/DoctorLogin'
import DoctorDashboard from './pages/DoctorDashboard'

const App = () => {
  return (
    <div>
      <Routes>
        <Route path='/' element = {<Home/>} />
        <Route path='/doctors' element = {<Doctors/>} />
        <Route path='/services' element = {<Services/>} />
        <Route path='/about' element = {<About/>} />
        <Route path='/contact' element = {<Contact/>} />
        <Route path='/doctor-admin/login' element = {<DoctorLogin/>} />
        <Route path='/doctor-dashboard' element = {<DoctorDashboard/>} />
        <Route path='*' element = {<Home/>} />
      </Routes>
    </div>
  )
}

export default App
