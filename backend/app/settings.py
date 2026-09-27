from pydantic_settings import BaseSettings, SettingsConfigDict


# Application Settings

class Settings(BaseSettings):
    APP_NAME: str = "Chirp"

    DB_USERNAME: str
    DB_PASSWORD: str
    DB_HOST: str = "localhost"
    DB_PORT: int = 5432
    DB_NAME: str = "chirp_db"

    model_config = SettingsConfigDict(
        env_file=".env",
        extra="ignore"
    )


settings = Settings()