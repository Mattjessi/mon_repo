import React, { useState, useEffect } from 'react';
import { Navigate } from 'react-router-dom';
import axios from 'axios';

async function refreshAccessToken(Rtoken) {
    try {
        const response = await axios.post('https://localhost:4343/users/api/token/refresh/', { refresh: Rtoken })
		console.log(response)
        if (response.data.access) {
            localStorage.setItem("accessToken", response.data.access)
            return true
        }
        return false
    }
	catch (error) {
        console.log(error)
		localStorage.removeItem("accessToken")
		localStorage.removeItem("refreshToken")
        return false
    }
}

async function isTokenExpired(Atoken) {
    if (!Atoken || !Atoken.includes('.'))
		return true
    const payload = JSON.parse(atob(Atoken.split('.')[1]))
    const expiryTime = payload.exp * 1000
    const currentTime = Date.now()
    return currentTime >= expiryTime
}

async function isAuthenticated() {
    const Atoken = localStorage.getItem("accessToken")
    const Rtoken = localStorage.getItem("refreshToken")
    if (!Atoken || !Rtoken)
		return false
    if (await isTokenExpired(Atoken))
        return await refreshAccessToken(Rtoken)
    return true
}

function PrivateRoute({ element }) {
    const [authChecked, setAuthChecked] = useState(false)
    const [isAuth, setIsAuth] = useState(false)

    useEffect(() => {
        const checkAuth = async () => {
            const authStatus = await isAuthenticated()
            setIsAuth(authStatus)
            setAuthChecked(true)
        }
        checkAuth()
    }, [])

    if (!authChecked)
        return <div>Loading...</div>
    console.log("Private = ", isAuth)
	return isAuth ? element : <Navigate to={"/"} />
}

function PublicRoute({ element }) {
	const [authChecked, setAuthChecked] = useState(false)
    const [isAuth, setIsAuth] = useState(false)

    useEffect(() => {
        const checkAuth = async () => {
            const authStatus = await isAuthenticated()
            setIsAuth(authStatus)
            setAuthChecked(true)
        }
        checkAuth()
    }, [])
    if (!authChecked)
        return <div>Loading...</div>
	console.log("Public = ", isAuth)
    return isAuth ? <Navigate to={"/home"}/> : element
}

export { PrivateRoute, PublicRoute }
