import React, { useRef, useState } from "react"
import { useNavigate } from "react-router-dom"
import { Card } from "react-bootstrap"
import Gameplay from '../gameplay/settings/page'
import Header from "../global/header"

function Home() {
	const navigate = useNavigate();
	const canva = useRef(null);
  
	const cardData = [
		{ src: "Local.svg", title: "Local", path: "/local" },
		{ src: "AI.svg", title: "AI", path: "/home" },
		{ src: "Crown.svg", title: "Tournament", path: "/home" },
		{ src: "Online.svg", title: "Online", path: "/home" },
		{ src: "Multiplayer.svg", title: "Multiplayer", path: "/home" },]
		
	function CardItem({ src, title, path }) {
	
		const [hovered, setHovered] = useState(true);
		
		return (
			<div role="button" onClick={path} className="col-6 col-sm-3 col-lg-2"
				style={{transition: "transform 0.6s", transformStyle: "preserve-3d",}}
				onMouseEnter={() => setHovered(false)} onMouseLeave={() => setHovered(true)}>
				{hovered ?
					<Card className="p-3 p-sm-4 p-xl-5 pb-0 rounded-0 text-bg-dark">
						<Card.Img variant="top" src={src} />
						<Card.Body className="pt-3 pt-sm-4 pt-xl-5 pb-3 pb-sm-0">
							<Card.Title className="row justify-content-center m-0">{title}</Card.Title>
						</Card.Body>
						</Card> :
						<Card className="p-3 p-sm-4 p-xl-5 pb-0 rounded-0 text-bg-dark">
							<Card.Img variant="top" src={src}/>
						</Card>}
			</div>
		)
	}

	return (
		<>
			<Header/>
			<main>
				<div className="position-fixed top-0">
					<Gameplay canva={canva} />
		  		</div>
				<div className="d-flex vh-100 w-100 justify-content-center align-items-lg-center pt-5 pt-lg-0 px-xl-5">
					<div className="pt-5 pt-lg-0 px-xl-5">
						<div className="pb-5 pt-5 pt-lg-0 px-xl-5">
							<div className="container">
								<div className="justify-content-center align-items-center w-100 row px-5 g-1">
									{cardData.map((card, index) => (
										<CardItem 
											key={index} 
											src={card.src} 
											title={card.title} 
											path={() => navigate(card.path)} 
					  					/>))}
								</div>
							</div>
						</div>
					</div>
				</div>
			</main>
		</>
	)
}  

export default Home