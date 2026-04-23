import json
import random
from pathlib import Path
from logger_sorteio import SorteioLogger

class SorteioManager:
    def __init__(self, potes_customizados=None):
        data_path = Path(__file__).parent / "data" / "teams.json"
        
        try:
            with open(data_path, "r", encoding="utf-8") as f:
                self.todos_times = json.load(f)
        except FileNotFoundError:
            print(f"❌ SorteioManager não achou o JSON em: {data_path}")
            raise
        
        if potes_customizados:
            self.potes = potes_customizados
        else:
            self.potes = self._criar_potes_padrao()
        
        self.nomes_grupos = ['A', 'B', 'C', 'D', 'E', 'F', 'G', 'H', 'I', 'J', 'K', 'L']

    def _criar_potes_padrao(self):
        potes = {}
        for i in range(1, 5):
            potes[i] = [t for t in self.todos_times if t["pote"] == i]
        return potes

    def pode_adicionar_time(self, time, grupo_times):
        confederacao = time["confederacao"]
        count_confederacao = sum(1 for t in grupo_times if t["confederacao"] == confederacao)
        
        if confederacao == "UEFA":
            return count_confederacao < 2
        else:
            return count_confederacao == 0

    def sortear(self, pais_sede="Estados Unidos", potes_customizados=None):
        if potes_customizados:
            self.potes = potes_customizados

        # --- LOGICA DE BACKTRACKING GLOBAL ---
        tentativas_globais = 0
        max_tentativas_globais = 50 # Quantas vezes reiniciamos o sorteio inteiro

        while tentativas_globais < max_tentativas_globais:
            tentativas_globais += 1
            try:
                SorteioLogger.log_inicio_sorteio(f"Tentativa Global {tentativas_globais}", len(self.potes))
                
                # Inicializa grupos A-L vazios a cada tentativa global
                grupos_atualizados = {g: [] for g in self.nomes_grupos}

                # 1. ALOCAR ANFITRIÕES (Pote 1)
                times_pote1 = self.potes[1].copy()
                hosts_config = {"México": "A", "Canadá": "B", "Estados Unidos": "D"}
                
                for nome_host, grupo_alvo in hosts_config.items():
                    host_obj = next((t for t in times_pote1 if nome_host.lower() in t["nome"].lower() or (nome_host == "Estados Unidos" and "usa" in t["nome"].lower())), None)
                    if host_obj:
                        grupos_atualizados[grupo_alvo].append(host_obj)
                        times_pote1.remove(host_obj)

                # 2. DISTRIBUIR RESTO DO POTE 1
                random.shuffle(times_pote1)
                for grupo_nome in self.nomes_grupos:
                    if not grupos_atualizados[grupo_nome] and times_pote1:
                        time = times_pote1.pop(0)
                        grupos_atualizados[grupo_nome].append(time)

                # 3. POTES 2, 3 E 4
                for num_pote in [2, 3, 4]:
                    sucesso_pote = self._alocar_pote(num_pote, grupos_atualizados)
                    if not sucesso_pote:
                        # Se falhar um pote, forçamos a reinicialização da tentativa global
                        raise ValueError(f"Impossível alocar Pote {num_pote}")

                # Se chegou aqui, o sorteio foi um sucesso total!
                SorteioLogger.log_fim_sorteio(grupos_atualizados)
                return grupos_atualizados

            except ValueError as e:
                SorteioLogger.log_erro(f"Reiniciando sorteio global: {str(e)}")
                continue

        # Se esgotar as tentativas globais
        raise Exception("Erro Crítico: A configuração de times atual é matematicamente impossível de sortear com as regras da FIFA. Tente trocar seleções de confederações repetidas.")

    def _alocar_pote(self, num_pote, grupos):
        """Tenta alocar times usando a heurística de 'Most Constrained Variable First'."""
        times_pote = self.potes[num_pote].copy()
        tentativas_locais = 0
        max_tentativas_locais = 500 # Diminuímos o loop, pois seremos mais assertivos

        while tentativas_locais < max_tentativas_locais:
            tentativas_locais += 1
            # Backup do estado
            backup_grupos = {g: list(v) for g, v in grupos.items()}
            
            # --- HEURÍSTICA: Ordenar times pelo nível de dificuldade ---
            # Times de confederações com mais representantes no pote saem na frente
            random.shuffle(times_pote) # Shuffle inicial para manter o aleatório
            times_ordenados = sorted(
                times_pote, 
                key=lambda t: sum(1 for x in times_pote if x["confederacao"] == t["confederacao"]),
                reverse=True
            )
            
            conflito = False
            for time in times_ordenados:
                # Encontrar grupos que respeitam len(num_pote-1) e a regra geográfica
                validos = [
                    g for g in self.nomes_grupos 
                    if len(grupos[g]) == (num_pote - 1) and self.pode_adicionar_time(time, grupos[g])
                ]
                
                if validos:
                    # Escolhe um grupo aleatório entre os válidos
                    grupo_sel = random.choice(validos)
                    grupos[grupo_sel].append(time)
                else:
                    conflito = True
                    break
            
            if not conflito:
                return True
            
            # Restore backup
            for g in self.nomes_grupos:
                grupos[g] = list(backup_grupos[g])
                
        return False

    def formatar_resultado(self, grupos):
        resultado = {}
        for nome_grupo, times in grupos.items():
            resultado[nome_grupo] = {
                "times": times,
                "total": len(times)
            }
        return resultado

def fazer_sorteio(pais_sede="USA", potes_customizados=None):
    manager = SorteioManager(potes_customizados)
    grupos = manager.sortear(pais_sede, potes_customizados)
    return manager.formatar_resultado(grupos)