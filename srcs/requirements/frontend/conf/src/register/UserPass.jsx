import React, { useState, useEffect } from "react"
import { useNavigate } from "react-router-dom"
import { Button, Form } from "react-bootstrap"
import ErrorModal from "../global/error-modal"
import axios from 'axios'

function UserPass() {

	const navigate = useNavigate()

	const [username, setUsername] = useState('')
	const [password1, setPassword1] = useState('')
	const [password2, setPassword2] = useState('')
	const [errorMessage, setErrorMessage] = useState('');

	const [passShow1, setPassShow1] = useState(false)
	const showPass1 = () => setPassShow1(true)
	const hidePass1 = () => setPassShow1(false)

	const [passShow2, setPassShow2] = useState(false)
	const showPass2 = () => setPassShow2(true)
	const hidePass2 = () => setPassShow2(false)

	const [show, setShow] = useState(false)
	const hideModal = () => setShow(false)
	const [code, setCode] = useState(0)

	const sendAuth = async (e) => {
		e.preventDefault()
		try {
			const response = await axios.post('https://localhost:4343/users/api/register/', {
				username: username,
				password: password1,
				password2: password2
			})
			//console.log(response.data)
			if (response.data.code == 1000) {
				navigate("/")
			}
		}
		catch (error) {
			console.log(error)
			setUsername("")
			setPassword1("")
			setPassword2("")
			if (error.response.data.code)
				setCode(error.response.data.code)
			else
				setCode(1009)
			setShow(true)
		}
	}

	return (
        <Form>
            <Form.Group className="fs-5 fs-lg-4 mb-2 mb-lg-4">
                <Form.Label className="mb-2 text-light" htmlFor="username">Username</Form.Label>
                <Form.Control
                    type="text"
                    value={username}
                    placeholder="Insert username"
                    onChange={(e) => setUsername(e.target.value)}
					name="username"
					id="username"
					autoComplete="username"
                />
            </Form.Group>
            <Form.Group className="fs-5 fs-lg-4 mb-2 mb-lg-4">
                <Form.Label className="mb-2 text-light" htmlFor="password">Password</Form.Label>
                <div className="d-flex">
                    <Form.Control
                        type={passShow1 ? "text" : "password"}
                        value={password1}
                        placeholder="Insert password"
                        onChange={(e) => setPassword1(e.target.value)}
                        className="rounded-0 rounded-start"
						name="password"
						id="password"
						autoComplete="current-password"
                    />
                    <Button
                        type="button"
                        className="rounded-0 rounded-end btn btn-light"
						aria-label="show"
                        onClick={passShow1 ? hidePass1 : showPass1}
                    >
                        {passShow1 ? <i className="eye bi-eye-fill"></i>
                                  : <i className="eye bi-eye-slash-fill"></i>}
                    </Button>
                </div>
				<div className="d-flex">
                    <Form.Control
                        type={passShow2 ? "text" : "password"}
                        value={password2}
                        placeholder="Insert password"
                        onChange={(e) => setPassword2(e.target.value)}
                        className="rounded-0 rounded-start"
						name="password"
						id="password2"
						autoComplete="current-password"
                    />
                    <Button
                        type="button"
                        className="rounded-0 rounded-end btn btn-light"
						aria-label="show"
                        onClick={passShow2 ? hidePass2 : showPass2}
                    >
                        {passShow2 ? <i className="eye bi-eye-fill"></i>
                                  : <i className="eye bi-eye-slash-fill"></i>}
                    </Button>
                </div>
            </Form.Group>
			<div className="d-flex justify-content-center pt-3 mb-3 mb-lg-5">
				<Button
					type="submit"
					className="btn btn-secondary rounded fw-bolder"
					onClick={sendAuth}
				>
					REGISTER
				</Button>
			</div>
			<div className="d-flex justify-content-end pt-3">
				<Button
					type="button"
					className="btn btn-secondary rounded fw-bolder"
					onClick={() => navigate("/")}
				>
					LOGIN
				</Button>
			</div>
			<ErrorModal show={ show } hideModal={ hideModal } contextId={ 0 } code={ code } />
        </Form>
    )
}

export default UserPass
