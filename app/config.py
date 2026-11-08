from functools import lru_cache

from pydantic_settings import BaseSettings, SettingsConfigDict


class Settings(BaseSettings):
    model_config = SettingsConfigDict(env_file=".env", extra="ignore")

    pey_api_key: str = ""
    pey_webhook_secret: str = ""
    pey_base_url: str = ""
    openai_api_key: str = ""
    openai_model_texto: str = ""
    openai_model_voz: str = ""
    server_signing_key: str = ""
    demo_mode: bool = False
    demo_real_amount: str = "0.01"
    database_path: str = "sinsenal.db"


@lru_cache
def get_settings() -> Settings:
    return Settings()
