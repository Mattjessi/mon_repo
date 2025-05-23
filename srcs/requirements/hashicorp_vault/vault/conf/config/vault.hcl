ui = false
api_addr = "http://172.20.0.9:8200"
disable_mlock = true

storage "file" {
	path = "/vault/data"
}

listener "tcp" {
	address = "172.20.0.9:8200"
	tls_disable = 1
}
