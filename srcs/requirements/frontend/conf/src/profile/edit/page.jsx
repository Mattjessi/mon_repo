import React, { useRef, useEffect, useState } from "react"
import { useLocation } from "react-router-dom"
import { Image, Form, Button } from "react-bootstrap"
import axios from 'axios'
import Header from "../../global/header.jsx"
import Gameplay from '../../gameplay/settings/page'

function ProfileEdit() {

	const canva = useRef(null)

	const [user, setUser] = useState(null)
	const url = useLocation()

	const [file, setFile] = useState(null)
	const [text, setText] = useState(null)

	const checkURL = async () => {

		try {
			const username = url.pathname.split('/')[2]
			const Atoken = localStorage.getItem('accessToken')
			const Rtoken = localStorage.getItem('refreshToken')
			const config = {headers: {Authorization: `Bearer ${Atoken}`}}
			const params = { token: Rtoken }
			const playerData = await axios.get('https://localhost:4343/users/api/player/', {headers: config.headers, param: params})
			const data = playerData.data.filter(player => player.name == username)
			if (data.length == 1)
				setUser(data[0])
		}
		catch(error) {
			console.log(error)
		}
	}

	useEffect(() => {
		checkURL()
	}, [url.pathname])

	if (!user)
		return (<></>)

	const updateInfo = async () => {

		try {
			const Atoken = localStorage.getItem('accessToken')
			const Rtoken = localStorage.getItem('refreshToken')
			const config = {headers: {Authorization: `Bearer ${Atoken}`}}
			const params = { token: Rtoken }
			const response = await axios.put('https://localhost:4343/users/api/player/update-info/', {headers: config.headers, param: params})
			console.log(response)
		}
		catch(error) {
			console.log(error)
		}
	}

	return (
		<>
			<Header/>
			<main>
				<div className="position-fixed top-0">
					<Gameplay canva={canva} />
					<div className="position-absolute top-50 start-50 translate-middle">
						<div className="rounded border border-black border-2 px-3 px-lg-5 pt-2 pt-lg-4 pb-3 pb-lg-4"
							style={{background: "rgba(0, 0, 0, 0.7)"}}>
							<Image src={user.avatar} className={`${	user.online
									? "border border-success"
									: "border border-danger"} border-3 rounded-circle`}
								style={{ width: "150px", height: "150px", objectFit: "cover" }}/>
							<Image src={file ? file : user.avatar} className={`${	user.online
									? "border border-success"
									: "border border-danger"} border-3 rounded-circle`}
								style={{ width: "150px", height: "150px", objectFit: "cover" }}/>
							<Form>
								<Form.Group>
									<Form.Control value={file} onChange={(e) => setFile(e.target.value)} class="form-control" type="file" id="formFile"/>
								</Form.Group>
							</Form>
							<Button className="rounded-0 btn btn-dark fw-bolder" onClick={() => updateInfo()}>
								<i className="bi bi-pencil" style={{fontSize: "20px"}}/>
							</Button>
						</div>
					</div>
				</div>
			</main>
		</>
	)
}

export default ProfileEdit
