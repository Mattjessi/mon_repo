import React from "react"
import { useNavigate } from "react-router-dom"
import { Modal, Button } from "react-bootstrap"
import axios from 'axios'
import "./style.css"

function QuitModal({ quit, setQuit }) {

	const navigate = useNavigate()

	const handleClose = () => setQuit(false)

	const disconnect = async (e) => {
		//localStorage.removeItem("accessToken")
		//localStorage.removeItem("refreshToken")
		e.preventDefault()
		try {
			const Atoken = localStorage.getItem('accessToken')
			const Rtoken = localStorage.getItem('refreshToken')
			const config = {headers: {Authorization: `Bearer ${Atoken}`}}
			const response = await axios.post('https://localhost:4343/users/api/logout/', {token: Rtoken}, config)
			if (response.data.code == 1000) {
				localStorage.removeItem("accessToken")
				localStorage.removeItem("refreshToken")
				localStorage.removeItem("playerID")
				localStorage.removeItem("playerName")
				handleClose()
				navigate("/")
			}
		}
		catch (error) {
			console.log(error)
			handleClose()
		}
	}

	const resetall = async (e) => {
		e.preventDefault()
		try {
			localStorage.removeItem("accessToken")
			localStorage.removeItem("refreshToken")
			localStorage.removeItem("playerID")
			localStorage.removeItem("playerName")
		}
		catch (error) {
			console.log(error)
			handleClose()
		}
	}

	return (
		<Modal show={quit} onHide={handleClose} className="global-modal">
			<Modal.Header closeButton>
				<Modal.Title>Are you sure you want to log out ?</Modal.Title>
			</Modal.Header>
			<Modal.Body className="global-quit-button">
				<Button onClick={disconnect} className="global-quit-yes">Yes</Button>
				<Button onClick={handleClose} className="global-quit-no">No</Button>
				<Button onClick={resetall} className="global-quit-no">Reset</Button>
			</Modal.Body>
		</Modal>
	)
}

export default QuitModal
