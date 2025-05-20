import React from 'react'
import { Routes, Route } from 'react-router-dom'
import { PublicRoute, PrivateRoute } from './api/api'
import Login from './login/page'
import Register from './register/page'
import Home from './home/page'
import Profile from './profile/page'
import ProfileEdit from './profile/edit/page'
import Local from './game/local/page'
import LocalGame from './game/local/game/page'

const App = () => {

	return (
		<Routes>
			<Route path="/" element={ <PublicRoute element={ <Login/> }/>}/>
			<Route path="/register" element={ <PublicRoute element={ <Register/> }/>}/>
			<Route path="/home" element={ <PrivateRoute element={ <Home/> }/>}/>
			<Route path="/profile/:userID" element={ <PrivateRoute element={ <Profile/> }/>}/>
			<Route path="/profile/:userID/edit" element={ <PrivateRoute element={ <ProfileEdit/> }/>}/>
			<Route path="/local" element={ <PrivateRoute element={ <Local/> }/>}/>
			<Route path="/local/game" element={ <PrivateRoute element={ <LocalGame/> }/>}/>
		</Routes>)
}

export default App;