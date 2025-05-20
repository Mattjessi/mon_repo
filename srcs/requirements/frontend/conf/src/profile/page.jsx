import React, { useRef, useEffect, useState } from "react"
import { useLocation, useNavigate } from "react-router-dom"
import { Card, Image, Button } from "react-bootstrap"
import axios from 'axios'
import Header from "../global/header.jsx"
import Gameplay from '../gameplay/settings/page'

function Profile() {

	const navigate = useNavigate()

	const canva = useRef(null)

	const [user, setUser] = useState(null)
	const [cardData, setCardData] = useState(null)
	const url = useLocation()

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
		setCardData([
			{ src: "Local.svg", title: "Local", winrate: 0, total: 0 },
			{ src: "AI.svg", title: "AI", winrate: 0, total: 0 },
			{ src: "Crown.svg", title: "Tournament", winrate: 0, total: 0 },
			{ src: "Online.svg", title: "Online", winrate: 0, total: 0 },
			{ src: "Multiplayer.svg", title: "Multiplayer", winrate: 0, total: 0 },])
	}, [url.pathname])

	if (!user)
		return (<></>)
	console.log(user)

	function CardItem({ src, title, winrate, total }) {

		const [hovered, setHovered] = useState(true);

		return (
			<div role="button" className="col-10 col-sm-6 col-lg-4"
				style={{transform: hovered ? "rotateY(0deg)" : "rotateY(180deg)",
					transition: "transform 0.6s", transformStyle: "preserve-3d",}}
				onMouseEnter={() => setHovered(false)} onMouseLeave={() => setHovered(true)}>
				<Card className="p-2 p-sm-3 rounded-0 text-bg-dark h-100 d-flex flex-column justify-content-between align-items-center" style={ hovered ? {} : {transform: "rotateY(180deg)"}}>
					{hovered ? (
						<>
							<Card.Img variant="top" src={src} className="img-fluid w-50" />
							<Card.Body className="pt-3 pt-sm-4 pt-xl-5 pb-3 pb-sm-0 w-100">
								<Card.Title className="row justify-content-center m-0 text-center">{title}</Card.Title>
							</Card.Body>
						</>
							) : (
							<div className="d-flex flex-column align-items-center gap-1">
								<h4 className="fs-6 mb-0">WINRATE</h4>
								<h4 className="mb-0">{winrate} %</h4>
								<h1 className="mb-0">-------</h1>
								<h3 className="fs-6 mb-0">TOTAL</h3>
								<h4 className="mb-0">{total}</h4>
							</div>)}
				</Card>
			</div>
			)
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
							<Button className="position-absolute top-0 end-0 m-2 rounded-0 btn btn-dark fw-bolder" onClick={() => navigate("edit")}>
								<i className="bi bi-pencil" style={{fontSize: "20px"}}/>
							</Button>
							<div className="container d-flex flex-column justify-content-center align-items-center">
								<Image src={user.avatar} className={`${	user.online
										? "border border-success"
										: "border border-danger"} border-3 rounded-circle`}
				  					style={{ width: "150px", height: "150px", objectFit: "cover" }}/>
								<h1 className="mt-3 text-light text-center user-select-none">{user.name}</h1>
								{user.description && (<h4 className="fst-italic text-light text-center mt-2 user-select-none">{user.description}</h4>)}
								<div className="justify-content-center align-items-center row g-3">
									{cardData.map((card, index) => (<CardItem key={index} src={card.src} title={card.title} winrate={card.winrate} total={card.total}/>))}
								</div>
							</div>
						</div>
					</div>
				</div>
			</main>
		</>
	)
}

export default Profile
