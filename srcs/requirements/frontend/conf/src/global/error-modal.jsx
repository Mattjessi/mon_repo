import React from "react"
import { Modal, Button } from "react-bootstrap"
import "./style.css"

function ErrorModal({ show, hideModal, contextId, code }) {

	const context = ["Registration Error !", "Connection Error !"]
	const error = ["", "Passwords are not similar.", "Username is already taken.",
					"Password is not strong enough.\nPassword must contain at least 8 characters.",
					"Password is not strong enough.\nPassword must contain at least one number.",
					"Password is not strong enough.\nPassword must contain at least one lowercase letter.",
					"Password is not strong enough.\nPassword must contain at least one capital letter.",
					"Password is not strong enough.\nPassword must contain at least one special character (!@#$%^&*...).",
					"Password is incorrect.", "Username required.", "Password's' required.", "Token required.",
					"Invalid token.", "Username or Password incorrect.", ]

	let errorId;
	
	switch (code) {
		
		case 1001: errorId = 1
					break
		case 1002: errorId = 2
					break
		case 1003: errorId = 3
					break
		case 1004: errorId = 4
					break
		case 1005: errorId = 5
					break
		case 1006: errorId = 6
					break
		case 1007: errorId = 7
					break
		case 1008: errorId = 8
					break
		case 1009: errorId = 9
					break
		case 1010: errorId = 10
					break
		case 1011: errorId = 11
					break
		case 1012: errorId = 12
					break
		case 1013: errorId = 13
					break
		default: errorId = 0
					break
	}

	return (
		<Modal show={show} onHide={hideModal} className="global-modal">
			<Modal.Header closeButton>
				<Modal.Title>{context[contextId]}</Modal.Title>
			</Modal.Header>
			<Modal.Body>{error[errorId]}</Modal.Body>
		</Modal>
	)
}

export default ErrorModal