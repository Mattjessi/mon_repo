import os
import sys
import django
import hvac
from django.core.management import call_command
from django.contrib.auth import get_user_model

# Extraction du token
with open('./game_pong_django/game_pong_django', 'r') as file:
    vault_token = file.read().strip()

# Initialisation du client Vault
client = hvac.Client(url='http://vault:8200', token=vault_token)

if not client.is_authenticated():
    raise Exception("Authentification échouée avec Vault")

keys = [
    'django_super_user_name',
    'django_super_user_password',
    'django_super_user_email'
]

secrets = {}

# Récupération des secrets depuis Vault et extraction des valeurs spécifiques
for key in keys:
    response = client.secrets.kv.v1.read_secret(path=f'game_pong/django/{key}')
    secrets[key] = response['data'].get(key)

# Préparation du contexte Django
BASE_DIR = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
sys.path.append(BASE_DIR)
os.environ.setdefault('DJANGO_SETTINGS_MODULE', 'django_game_pong.settings')
django.setup()

# Récupération des variables d'environnement
username = secrets['django_super_user_name']
email = secrets['django_super_user_email']
password = secrets['django_super_user_password']

if not all([username, email, password]):
    print("Veuillez définir SUPER_USER_NAME, SUPER_USER_EMAIL et SUPER_USER_PASSWORD dans l'environnement.")
    sys.exit(1)

# Vérifier si le superutilisateur existe
User = get_user_model()
if User.objects.filter(username=username).exists():
    print(f"Le superutilisateur '{username}' existe déjà.")
    sys.exit(0)

# Créer le superuser
print(f"Création du superutilisateur '{username}'...")
call_command('createsuperuser',
             username=username,
             email=email,
             interactive=False)

# Définir le mot de passe (car --noinput ne le fait pas)
user = User.objects.get(username=username)
user.set_password(password)
user.save()

print(f"Superutilisateur '{username}' créé avec succès.")
