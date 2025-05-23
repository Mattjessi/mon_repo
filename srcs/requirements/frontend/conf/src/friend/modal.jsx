import React, { useState } from "react"
import { Modal, Tabs, Tab } from "react-bootstrap"
import ListModal from "./list"
import SearchModal from "./search"
import RequestModal from "./request"
import BlockModal from "./block"

function FriendModal({ friend, setFriend }) {

	const handleClose = () => setFriend(false)
	const [tab, setTab] = useState('friendlist')

	return (
		<Modal show={friend} onHide={handleClose}>
			<Modal.Header closeButton />
			<Modal.Body>
				<Tabs activeKey={tab} onSelect={setTab} fill>
					<Tab eventKey="friendlist" title="Friend List">
						<ListModal tab={ tab }/>
					</Tab>
					<Tab eventKey="addfriend" title="Add Friend">
						<SearchModal tab={ tab }/>
					</Tab>
					<Tab eventKey="friendrequest" title="Friend Request">
						<RequestModal tab={ tab }/>
					</Tab>
					<Tab eventKey="blocklist" title="Block List">
						<BlockModal tab={ tab }/>
					</Tab>
    			</Tabs>
			</Modal.Body>
		</Modal>
	)
}

export default FriendModal