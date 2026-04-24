import os
import sys
from pathlib import Path
from fastapi.responses import StreamingResponse
from exportador_imagem import gerar_imagem_grupos

# 1. PEGA O CAMINHO ABSOLUTO DA PASTA BACKEND
current_dir = Path(__file__).parent.resolve()

# 2. INJETA O CAMINHO NO TOPO DA BUSCA DO PYTHON
if str(current_dir) not in sys.path:
    sys.path.insert(0, str(current_dir))

import sys
import os
import json
from pathlib import Path
from fastapi import FastAPI, HTTPException
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel
from typing import Optional, Dict, List, Any

# 1. LOCALIZAÇÃO ABSOLUTA
# Resolve o caminho do diretório onde o app.py está (pasta backend)
BASE_DIR = Path(__file__).resolve().parent

# 2. CONFIGURAÇÃO DE IMPORTS
if str(BASE_DIR) not in sys.path:
    sys.path.append(str(BASE_DIR))

# Agora os imports funcionam com segurança
from sorteio import fazer_sorteio
from logger_sorteio import SorteioLogger

app = FastAPI()

# 3. CAMINHO DA DATABASE
# Forçamos o caminho para dentro da pasta 'backend/data/'
DATA_PATH = BASE_DIR / "data" / "teams.json"

# Print de debug - Isso vai aparecer no seu terminal e nos logs da Vercel
print(f"--- 💡 SISTEMA INICIALIZADO ---")
print(f"Procurando database em: {DATA_PATH}")
print(f"Arquivo existe? {'✅' if DATA_PATH.exists() else '❌'}")

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
    """Carrega os times do JSON com tratamento de erro profissional"""
    if not DATA_PATH.exists():
        msg = f"Database não encontrada no caminho: {DATA_PATH}"
        print(f"❌ {msg}")
        raise HTTPException(status_code=500, detail=msg)

    try:
        with open(DATA_PATH, "r", encoding="utf-8") as f:
            return json.load(f)
    except Exception as e:
        print(f"❌ Erro ao ler JSON: {str(e)}")
        raise HTTPException(status_code=500, detail=str(e))

def carregar_times_disponiveis():
    try:
        times_nativos = carregar_times()
        nomes_nativos = set(t["nome"] for t in times_nativos)
        
        data_dir = BASE_DIR / "data"
        confederacoes = ["uefa", "conmebol", "concacaf", "caf", "afc", "ofc"]
        
        times_disponiveis = []
        id_counter = 1000 
        
        for conf in confederacoes:
            json_path = data_dir / f"{conf}.json"
            if not json_path.exists():
                continue
            
            try:
                with open(json_path, "r", encoding="utf-8") as f:
                    times_conf = json.load(f)
                    
                for time in times_conf:
                    if time["nome"] in nomes_nativos:
                        continue
                    
                    # --- CORREÇÃO AQUI ---
                    # Primeiro, tenta pegar a sigla que já existe no JSON da confederação
                    sigla = time.get("sigla")
                    
                    # Se não existir no JSON, aí sim tenta o fallback (mas evite gerar siglas lixo)
                    if not sigla:
                        palavras = time["nome"].split()
                        sigla = "".join(p[0].upper() for p in palavras if p)[:3]
                    # ----------------------

                    times_disponiveis.append({
                        "id": id_counter,
                        "nome": time["nome"],
                        "confederacao": time["confederacao"],
                        "sigla": sigla.upper(), # Garante que está em caixa alta para a API da FIFA
                        "rank": time.get("rank"),
                        "pontos": time.get("pontos"),
                        "origem": "draft"
                    })
                    id_counter += 1
                    
            except Exception as e:
                print(f"⚠️ Erro ao carregar {conf}.json: {str(e)}")
                continue
        
        return times_disponiveis
    except Exception as e:
        print(f"❌ Erro ao consolidar: {str(e)}")
        raise HTTPException(status_code=500, detail=str(e))

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
            
            # 1. Base unificada de busca (Crucial!)
            times_nativos = carregar_times()
            times_extras = carregar_times_disponiveis()
            base_completa = times_nativos + times_extras 

            for num_pote, times_recebidos in request.potes_customizados.items():
                # Extrai IDs independente se vem como objeto ou int
                ids_alvo = [int(t["id"]) if isinstance(t, dict) else int(t) for t in times_recebidos]
                
                # Busca na base unificada
                times_validados = [t for t in base_completa if t["id"] in ids_alvo]
                
                # --- LOG DE AUDITORIA ---
                print(f"📊 Pote {num_pote}: Recebidos {len(ids_alvo)} IDs -> Recuperados {len(times_validados)} Objetos")
                
                if len(times_validados) != 12:
                    # Se faltar time, a gente mata o processo aqui com um erro claro
                    nomes_recebidos = [t.get("nome", "Desconhecido") for t in times_recebidos] if isinstance(times_recebidos[0], dict) else ids_alvo
                    raise ValueError(f"Pote {num_pote} incompleto! Esperava 12, achei {len(times_validados)}. Verifique se a seleção {nomes_recebidos} está com o ID correto.")

                potes_para_usar[int(num_pote)] = times_validados

        # Se passou na auditoria, chama o sorteio
        grupos = fazer_sorteio(request.pais_sede, potes_para_usar)
        return {"success": True, "grupos": grupos}
    
    except Exception as e:
        print(f"❌ Erro no Sorteio: {str(e)}")
        raise HTTPException(status_code=500, detail=str(e))
        
@app.get("/api/logs")
def get_logs():
    """Retorna uma mensagem sobre os logs em ambiente serverless"""
    # Como não gravamos arquivos em disco na Vercel, retornamos uma instrução
    return {
        "success": True,
        "logs": "Ambiente Serverless: Logs persistentes em arquivo desativados. Verifique os logs em tempo real no console da Vercel."
    }

@app.get("/api/times/potes")
def get_times_por_pote():
    """Retorna os times agrupados para a tela de Personalizar Potes"""
    try:
        times = carregar_times()
        potes = {}
        # Organiza os times em dicionários de 1 a 4
        for i in range(1, 5):
            potes[i] = [t for t in times if t.get("pote") == i]
        
        return {
            "success": True,
            "potes": potes
        }
    except Exception as e:
        print(f"❌ Erro ao agrupar potes: {str(e)}")
        raise HTTPException(status_code=500, detail=str(e))

@app.get("/api/times/disponiveis")
def get_times_disponiveis():
    """
    Retorna lista consolidada de times disponíveis para draft.
    Inclui todos os times das confederações que NÃO estão em teams.json.
    """
    try:
        times = carregar_times_disponiveis()
        return {
            "success": True,
            "total": len(times),
            "times": times
        }
    except Exception as e:
        print(f"❌ Erro ao buscar times disponíveis: {str(e)}")
        raise HTTPException(status_code=500, detail=str(e))

@app.post("/api/exportar")
async def exportar_sorteio(request: Dict[str, Any]):
    print("🔔 REQUISIÇÃO RECEBIDA NA ROTA /api/exportar") # <-- Adicione este print
    grupos = request.get("grupos")
    if not grupos:
        raise HTTPException(status_code=400, detail="Dados dos grupos não fornecidos")
    
    imagem_stream = gerar_imagem_grupos(grupos)
    
    return StreamingResponse(
        imagem_stream, 
        media_type="image/png",
        headers={"Content-Disposition": "attachment; filename=sorteio_copa_2026.png"}
    )

if __name__ == "__main__":  
    import uvicorn
    # O uvicorn só vai rodar se você executar 'python app.py'
    # Em produção (Vercel), esse bloco será totalmente ignorado.
    uvicorn.run("app:app", host="0.0.0.0", port=8000, reload=True)