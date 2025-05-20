.PHONY: all clean fclean re

all:

	@docker compose -f ./srcs/docker-compose.yml up -d vault_postgresql > /dev/null

	@docker compose -f ./srcs/docker-compose.yml up -d vault > /dev/null

	@sh -c "./srcs/requirements/hashicorp_vault/vault/tools/init.sh"

	@docker compose -f ./srcs/docker-compose.yml up -d > /dev/null

	@docker exec service_user_handler_postgresql sh /home/init/02_replicat_init.sh > /dev/null
	@docker exec service_game_pong_postgresql sh /home/init/02_replicat_init.sh > /dev/null
	@docker exec service_live_chat_postgresql sh /home/init/02_replicat_init.sh > /dev/null
	@docker exec service_user_handler_postgresql sh /home/init/03_replicat_init.sh > /dev/null

clean:

	@docker compose -f ./srcs/docker-compose.yml down > /dev/null

fclean: clean

	@if [ $$(docker images -qa | wc -l) -ne 0 ]; then \
		docker rmi -f $(shell docker images -qa) > /dev/null; \
	fi

	@if [ $$(docker network ls -q | wc -l) -ne 0 ]; then \
		docker network prune -f > /dev/null; \
	fi

	@if [ $$(docker volume ls -q | wc -l) -ne 0 ]; then \
		docker volume rm -f $(shell docker volume ls -q) > /dev/null; \
	fi

	@if [ -e ./srcs/env/.env_vault_secrets_key ]; then \
		rm ./srcs/env/.env_vault_secrets_key > /dev/null; \
	fi

re: fclean all
