import logging
import os
from pathlib import Path

# 1. REMOVEMOS a criação de pastas físicas (LOG_DIR)
# 2. REMOVEMOS o FileHandler

# Limpeza de handlers para não conflitar com o Uvicorn/Vercel
root_logger = logging.getLogger()
if root_logger.hasHandlers():
    root_logger.handlers.clear()

# Configuração focada em STREAM (Console)
logging.basicConfig(
    level=logging.INFO,
    format='%(levelname)s - %(message)s',
    handlers=[
        logging.StreamHandler() # Agora só enviamos para o console/terminal
    ]
)

logger = logging.getLogger(__name__)

class SorteioLogger:
    @staticmethod
    def log_inicio_sorteio(pais_sede, potes_count):
        logger.info(f"🎲 INICIANDO SORTEIO - Hosts: {pais_sede}")
        logger.info(f"Potes: {potes_count}")
    
    @staticmethod
    def log_alocacao(time_nome, grupo, pote, confederacao):
        logger.info(f"✓ {time_nome} ({confederacao}) - Pote {pote} → Grupo {grupo}")

    @staticmethod
    def log_conflito(time_nome, confederacao, grupo):
        logger.warning(f"⚠ CONFLITO: {time_nome} ({confederacao}) não cabe no Grupo {grupo}")

    @staticmethod
    def log_redistribuicao(time_nome, origem, destino):
        logger.info(f"🔄 REDISTRIBUINDO: {time_nome} movido de {origem} para {destino}")

    @staticmethod
    def log_fim_sorteio(grupos):
        logger.info("=" * 40)
        logger.info("🏆 SORTEIO FINALIZADO")
        logger.info("=" * 40)

    @staticmethod
    def log_erro(mensagem):
        logger.error(f"❌ ERRO: {mensagem}")