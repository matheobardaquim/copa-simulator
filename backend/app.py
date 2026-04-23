import json
from pathlib import Path
from fastapi import FastAPI, HTTPException
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel
from typing import Optional, Dict, List, Any
from sorteio import fazer_sorteio
import os

app = FastAPI()

# REMOVIDO: os.makedirs("logs") - Não é permitido no ambiente read-only da Vercel

# Permitir requisições do frontend
app.add_middleware(
    CORSMiddleware,
    allow_origins=[
        "http://localhost:3000", 
        "http://localhost:5173",
        "https://seu-projeto.vercel.app" # ADICIONE SEU DOMÍNIO DE PRODUÇÃO AQUI
    ],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Modelos
class SorteioRequest(BaseModel):
    pais_sede: str = "Estados Unidos"
    potes_customizados: Optional[Dict[str, Any]] = None

def carregar_times():
    """Carrega os times do JSON com caminho absoluto"""
    base_dir = Path(__file__).parent
    # Ajuste para garantir que encontre a pasta 'data' no repositório
    data_path = base_dir.parent / "data" / "teams.json"
    
    if not data_path.exists():
        data_path = base_dir / "data" / "teams.json"

    with open(data_path, "r", encoding="utf-8") as f:
        return json.load(f)

@app.get("/")
def read_root():
    return {"message": "API de Sorteio rodando na Vercel 🚀"}

@app.get("/api/times")
def get_times():
    try:
        times = carregar_times()
        return {"success": True, "total": len(times), "times": times}
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

@app.post("/api/sorteio")
def realizar_sorteio(request: SorteioRequest):
    try:
        potes_para_usar = None
        if request.potes_customizados:
            potes_para_usar = {}
            from sorteio import SorteioManager
            manager_aux = SorteioManager() 
            for num_pote, ids_times in request.potes_customizados.items():
                ids_inteiros = [int(x["id"]) if isinstance(x, dict) else int(x) for x in ids_times]
                potes_para_usar[int(num_pote)] = [t for t in manager_aux.todos_times if t["id"] in ids_inteiros]
        
        grupos = fazer_sorteio(request.pais_sede, potes_para_usar)
        return {"success": True, "grupos": grupos, "pais_sede": request.pais_sede}
    except Exception as e:
        from logger_sorteio import SorteioLogger
        SorteioLogger.log_erro(f"Falha na API: {str(e)}")
        raise HTTPException(status_code=500, detail=f"Erro Interno: {str(e)}")

@app.get("/api/logs")
def get_logs():
    """Retorna uma mensagem sobre os logs em ambiente serverless"""
    # Como não gravamos arquivos em disco na Vercel, retornamos uma instrução
    return {
        "success": True,
        "logs": "Ambiente Serverless: Logs persistentes em arquivo desativados. Verifique os logs em tempo real no console da Vercel."
    }

if __name__ == "__main__":
    import uvicorn
    # O uvicorn só vai rodar se você executar 'python app.py'
    # Em produção (Vercel), esse bloco será totalmente ignorado.
    uvicorn.run("app:app", host="0.0.0.0", port=8000, reload=True)