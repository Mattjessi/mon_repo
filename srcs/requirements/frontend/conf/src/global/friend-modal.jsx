import React, { useEffect, useState } from "react"
import { useNavigate } from "react-router-dom"
import { Modal, Tabs, Tab } from "react-bootstrap"
import axios from 'axios'
//import 'bootstrap-icons/font/bootstrap-icons.css';

function FriendModal({ friend, setFriend }) {

	const navigate = useNavigate()

	const handleClose = () => setFriend(false)

	const [player, setPlayer] = useState([])
	const [search, setSearch] = useState('');
	const [filteredFriends, setFilteredFriends] = useState(player)
	const [tab, setTab] = useState('friendlist')

	const Atoken = localStorage.getItem('accessToken')
	const Rtoken = localStorage.getItem('refreshToken')
	const PlayerName = localStorage.getItem('playerName')
	const config = {headers: {Authorization: `Bearer ${Atoken}`}}
	const params = { token: Rtoken }

	const fonction = async (tab) => {

		try {

			const playerData = await axios.get('https://localhost:4343/users/api/player/', {headers: config.headers, param: params})
			if (!playerData.data || !tab)
				return

			let data, friendData, blockData

			if (tab != 'blocklist') {
				friendData = await axios.get('https://localhost:4343/users/api/friend/list/', {headers: config.headers, param: params})
				friendData = friendData.data
			}
			if (tab == 'addfriend' || tab == 'blocklist') {
				blockData = await axios.get('https://localhost:4343/users/api/block/list/', {headers: config.headers, param: params})
				blockData = blockData.data
			}

			const getAvatar = (name) => {
				const Avatar = playerData.data.find(player => player.name === name)
				return Avatar.avatar
			}

			if (tab == 'friendlist') {
				data = friendData
					.filter(player => player.status == "accepted" && player.player_1 == PlayerName)
					.map(player => ({
						name: player.player_2,
						id: player.id,
						avatar: getAvatar(player.player_2)}))
			}
			else if (tab == 'friendrequest') {
				data = friendData
					.filter(player => player.status == "pending")
					.map(player => ({
						sender: player.player_1,
						receiver: player.player_2,
						id: player.id,
						avatar: getAvatar(player.player_1 === PlayerName ? player.player_2 : player.player_1)}))
			}
			else if (tab == 'addfriend') {
				data = playerData.data
					.filter(player => PlayerName != player.name
						&& !friendData.some(friend => friend.player_1 == player.name
							|| friend.player_2 == player.name)
						&& !blockData.some(block => block.blocker == player.name
							|| block.blocked == player.name))
					.map(player => ({
						name: player.name,
						id: player.id,
						avatar: player.avatar}))
			}
			else if (tab == 'blocklist') {
				data = blockData
					.filter(player => player.blocker == PlayerName)
					.map(player => ({
						name: player.blocked,
						id: player.id,
						avatar: getAvatar(player.blocked)}))
			}
			setPlayer(data)
			setFilteredFriends(data)
		}
		catch(error) {
			console.log(error)
		}
	}

	useEffect(() => {
		setSearch('')
		if (friend) {
			setPlayer([])
			setFilteredFriends([])
			fonction(tab)
		}
	}, [tab])

	useEffect(() => {
		fonction(tab)
	}, [])

	const filterList = (e) => {
		const query = e.target.value
		setSearch(query)
	
		const filtered = player.filter(player =>
			player.name.toLowerCase().includes(query.toLowerCase())
		)
		setFilteredFriends(filtered)
	}

	const viewProfile = async (playerName) => {

		handleClose()
		navigate(`/profile/${playerName}`)
	}

	const removeFriend = async (playerID) => {
		try {
			const Atoken = localStorage.getItem('accessToken')
			const config = {headers: {Authorization: `Bearer ${Atoken}`}}
			const response = await axios.delete(`https://localhost:4343/users/api/friend/remove/${playerID}/`,
				{headers: config.headers})
			fonction(tab)
		}
		catch(error) {
			console.log(error)
		}
	}

	const addFriend = async (playerID) => {
		try {
			const Atoken = localStorage.getItem('accessToken')
			const config = {headers: {Authorization: `Bearer ${Atoken}`}}
			const params = { player_2: playerID }
			const response = await axios.post('https://localhost:4343/users/api/friend-request/send/', params, config)
			fonction(tab)
		}
		catch(error) {
			console.log(error)
		}
	}

	const addBlock = async (playerID) => {
		try {
			const Atoken = localStorage.getItem('accessToken')
			const config = {headers: {Authorization: `Bearer ${Atoken}`}}
			const params = { blocked_id: playerID }
			const response = await axios.post('https://localhost:4343/users/api/block/add/', params, config)
			fonction(tab)
		}
		catch(error) {
			console.log(error)
		}
	}

	const cancelRequest = async (playerID) => {
		try {
			const Atoken = localStorage.getItem('accessToken')
			const config = {headers: {Authorization: `Bearer ${Atoken}`}}
			const response = await axios.delete(`https://localhost:4343/users/api/friend-request/cancel/${playerID}/`,
				{headers: config.headers})
			fonction(tab)
		}
		catch(error) {
			console.log(error)
		}
	}

	const acceptRequest = async (playerID) => {
		try {
			const Atoken = localStorage.getItem('accessToken')
			const config = {headers: {Authorization: `Bearer ${Atoken}`}}
			const params = { player_2: playerID }
			const response = await axios.put(`https://localhost:4343/users/api/friend-request/accept/${playerID}/`, params, config)
			fonction(tab)
		}
		catch(error) {
			console.log(error)
		}
	}

	const rejectRequest = async (playerID) => {
		try {
			const Atoken = localStorage.getItem('accessToken')
			const config = {headers: {Authorization: `Bearer ${Atoken}`}}
			const response = await axios.delete(`https://localhost:4343/users/api/friend-request/reject/${playerID}/`,
				{headers: config.headers})
			fonction(tab)
		}
		catch(error) {
			console.log(error)
		}
	}

	const removeBlock = async (playerID) => {
		try {
			const Atoken = localStorage.getItem('accessToken')
			const config = {headers: {Authorization: `Bearer ${Atoken}`}}
			//const params = { player_2: playerID }
			const response = await axios.delete(`https://localhost:4343/users/api/block/remove/${playerID}/`,
				{headers: config.headers})
			fonction(tab)
		}
		catch(error) {
			console.log(error)
		}
	}

	return (
		<Modal show={friend} onHide={handleClose}>
			<Modal.Header closeButton />
			<Modal.Body>
				<Tabs activeKey={tab} onSelect={setTab} fill>
      				<Tab eventKey="friendlist" title="Friend List">
						<div>
    						<input type="text" placeholder="Search for a friend..." value={search} onChange={filterList}/>
  						</div>
						<div>
							<ul>
								{filteredFriends.length > 0 
									? (filteredFriends.map((player, index) => (
										<li key={index}>
											<img src={player.avatar} alt="Avatar" style={{ width: '40px', height: '40px', borderRadius: '50%' }}/>
											{player.name}
											<i className="bi bi-person-square" onClick={() => viewProfile(player.name)} />
											<i className="bi bi-x" onClick={() => removeFriend(player.id)} />
										</li>)))
									: <li>No friends found</li> }
							</ul>
						</div>
      				</Tab>
      				<Tab eventKey="addfriend" title="Add Friend">
						<div>
    						<input type="text" placeholder="Search for a friend..." value={search} onChange={filterList}/>
  						</div>
						<div>
							<ul>
								{filteredFriends.length > 0 
									? (filteredFriends.map((player, index) => (
										<li key={index}>
											<img src={player.avatar} alt="Avatar" style={{ width: '40px', height: '40px', borderRadius: '50%' }}/>
											{player.name}
											<i className="bi bi-person-plus-fill" onClick={() => addFriend(player.id)} />
											<i className="bi bi-ban" onClick={() => addBlock(player.id)} />
										</li>)))
									: <li>No friends found</li> }
							</ul>
						</div>
      				</Tab>
					<Tab eventKey="friendrequest" title="Friend Request">
						<div>
    						<input type="text" placeholder="Search for a friend..." value={search} onChange={filterList}/>
  						</div>
						<div>
							<ul>
								{filteredFriends.length > 0 
									? (filteredFriends.map((player, index) => (
										<li key={index}>
											<img src={player.avatar} alt="Avatar" style={{ width: '40px', height: '40px', borderRadius: '50%' }}/>
											{player.sender == localStorage.getItem('playerName')
												? (<>{player.receiver}
													<i className="bi bi-hourglass-split" />
													<i className="bi bi-x" onClick={() => cancelRequest(player.id)} /></>)
												: (<>{player.sender}
													<i className="bi bi-check-lg" onClick={() => acceptRequest(player.id)} />
													<i className="bi bi-x" onClick={() => rejectRequest(player.id)} /></>)}
										</li>)))
									: <li>No friends found</li> }
							</ul>
						</div>
      				</Tab>
					<Tab eventKey="blocklist" title="Block List">
						<div>
    						<input type="text" placeholder="Search for a friend..." value={search} onChange={filterList}/>
  						</div>
						<div>
							<ul>
								{filteredFriends.length > 0 
									? (filteredFriends.map((player, index) => (
										<li key={index}>
											<img src={player.avatar} alt="Avatar" style={{ width: '40px', height: '40px', borderRadius: '50%' }}/>
											{player.name}
											<i className="bi bi-person-plus-fill" onClick={() => removeBlock(player.id)} />
										</li>)))
									: <li>No friends found</li> }
							</ul>
						</div>
      				</Tab>
    			</Tabs>
			</Modal.Body>
		</Modal>
	)
}

export default FriendModal
