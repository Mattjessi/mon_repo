ui = false
api_addr = "http://172.20.0.9:8200"
disable_mlock = true

storage "postgresql" {
  connection_url = "postgresql://vault_postgresql:postgrespw@vault_postgresql:5432/vault"
}

listener "tcp" {
  address = "172.20.0.9:8200"
  tls_disable = 1
}
