import hvac

def get_vault_secrets():
    try:

        # Extraction du token
        with open('./game_pong_django/game_pong_django', 'r') as file:
            vault_token = file.read().strip()

        # Initialisation du client Vault
        client = hvac.Client(url='http://vault:8200', token=vault_token)

        if not client.is_authenticated():
            raise Exception("Authentification échouée avec Vault")
        
        keys = [
            'domain_name',
            'django_secret_key',
            'postgres_password',
            'postgres_host',
            'postgres_port',
            'postgres_user',
            'postgres_database_name',
            'django_super_user_name',
            'django_super_user_password',
            'django_super_user_email'
        ]

        secrets = {}

        # Récupération des secrets depuis Vault et extraction des valeurs spécifiques
        for key in keys:
            response = client.secrets.kv.v1.read_secret(path=f'game_pong/django/{key}')
            secrets[key] = response['data'].get(key)
        
        return secrets
    except Exception as e:
        print(f"Erreur lors de la récupération des secrets Vault : {e}")
        return None
