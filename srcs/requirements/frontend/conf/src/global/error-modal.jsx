import React from "react"
import { Modal } from "react-bootstrap"

function ErrorModal({ show, hideModal, contextId, code }) {

	const context = ["Registration Error !", "Connection Error !", "Edition Error !"]
	const error = ["", "Passwords are not similar.", "Username is already taken.",
					"Password is not strong enough.\nPassword must contain at least 8 characters.",
					"Password is not strong enough.\nPassword must contain at least one number.",
					"Password is not strong enough.\nPassword must contain at least one lowercase letter.",
					"Password is not strong enough.\nPassword must contain at least one capital letter.",
					"Password is not strong enough.\nPassword must contain at least one special character (!@#$%^&*...).",
					"Password is incorrect.", "Username required.", "Password's' required.", "Token required.",
					"Invalid token.", "Username or Password incorrect.",
					"", "", "", "", "", "", "", "", "",
					"", "", "", "", "", "", "", "", "",
					"Unauthorized file format (e.g. only JPEG and PNG are accepted).",
					"File size too high (e.g. max 2 MB).",
					"Image dimensions too large (e.g. max 500x500 pixels).",
					"Unable to read image (e.g. corrupt or invalid file)" ]

	let errorId;

	if (code > 1000 && code < 1036)
		errorId = code - 1000
	else
		errorId = 0

	return (
		<Modal show={show} onHide={hideModal}>
			<Modal.Header closeButton>
				<Modal.Title>{context[contextId]}</Modal.Title>
			</Modal.Header>
			<Modal.Body>{error[errorId]}</Modal.Body>
		</Modal>
	)
}

export default ErrorModal