import json
import random
from pathlib import Path
from logger_sorteio import SorteioLogger

class SorteioManager:
    # Mapeamento Técnico Oficial da FIFA: Pote → Índice (0-3) em cada Grupo
    # Ciclo 3-4-2 para Pote 2: A/D/G/J (slot 3→idx 2), B/E/H/K (slot 4→idx 3), C/F/I/L (slot 2→idx 1)
    SLOTS_TECNICOS_MAP = {
        'A': {1: 0, 2: 2, 3: 1, 4: 3},  # A1, A3, A2, A4
        'B': {1: 0, 2: 3, 3: 1, 4: 2},  # B1, B4, B2, B3
        'C': {1: 0, 2: 1, 3: 2, 4: 3},  # C1, C2, C3, C4
        'D': {1: 0, 2: 2, 3: 1, 4: 3},  # D1, D3, D2, D4
        'E': {1: 0, 2: 3, 3: 1, 4: 2},  # E1, E4, E2, E3
        'F': {1: 0, 2: 1, 3: 2, 4: 3},  # F1, F2, F3, F4
        'G': {1: 0, 2: 2, 3: 1, 4: 3},  # G1, G3, G2, G4
        'H': {1: 0, 2: 3, 3: 1, 4: 2},  # H1, H4, H2, H3
        'I': {1: 0, 2: 1, 3: 2, 4: 3},  # I1, I2, I3, I4
        'J': {1: 0, 2: 2, 3: 1, 4: 3},  # J1, J3, J2, J4
        'K': {1: 0, 2: 3, 3: 1, 4: 2},  # K1, K4, K2, K3
        'L': {1: 0, 2: 1, 3: 2, 4: 3},  # L1, L2, L3, L4
    }
    
    # Mapeamento reverso para slots numéricos (para compatibilidade)
    SLOTS_POTES = {
        1: [1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1],
        2: [3, 4, 2, 3, 4, 2, 3, 4, 2, 3, 4, 2],
        3: [2, 2, 3, 2, 2, 3, 2, 2, 3, 2, 2, 3],
        4: [4, 3, 4, 4, 3, 4, 4, 3, 4, 4, 3, 4],
    }
    
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
        self.grupos_pulados = []
        self.eventos_sorteio = []  # Timeline do sorteio

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

        tentativas_globais = 0
        max_tentativas_globais = 50 

        while tentativas_globais < max_tentativas_globais:
            tentativas_globais += 1
            try:
                SorteioLogger.log_inicio_sorteio(f"Tentativa Global {tentativas_globais}", len(self.potes))
                
                grupos_atualizados = {g: [] for g in self.nomes_grupos}
                self.eventos_sorteio = [] # 🟢 NOVO: A linha do tempo exata do sorteio

                # 1. ALOCAR ANFITRIÕES (Pote 1)
                times_pote1 = self.potes[1].copy()
                hosts_config = {"México": "A", "Canadá": "B", "Estados Unidos": "D"}
                
                for nome_host, grupo_alvo in hosts_config.items():
                    host_obj = next((t for t in times_pote1 if nome_host.lower() in t["nome"].lower() or (nome_host == "Estados Unidos" and "usa" in t["nome"].lower())), None)
                    if host_obj:
                        host_obj["slotNumber"] = 1  # Hosts sempre no slot 1
                        grupos_atualizados[grupo_alvo].append(host_obj)
                        grupo_idx = self.nomes_grupos.index(grupo_alvo)
                        slot_numero = self.SLOTS_POTES[1][grupo_idx]
                        self.eventos_sorteio.append({"isPulo": False, "pote": 1, "grupo": grupo_alvo, "slotNumber": slot_numero, "time": host_obj})
                        times_pote1.remove(host_obj)

                # 2. DISTRIBUIR RESTO DO POTE 1
                random.shuffle(times_pote1)
                for grupo_nome in self.nomes_grupos:
                    if not grupos_atualizados[grupo_nome] and times_pote1:
                        time = times_pote1.pop(0)
                        grupo_idx = self.nomes_grupos.index(grupo_nome)
                        slot_numero = self.SLOTS_POTES[1][grupo_idx]
                        time["slotNumber"] = slot_numero
                        grupos_atualizados[grupo_nome].append(time)
                        self.eventos_sorteio.append({"isPulo": False, "pote": 1, "grupo": grupo_nome, "slotNumber": slot_numero, "time": time})

                # 3. POTES 2, 3 E 4
                self.grupos_pulados = []  
                for num_pote in [2, 3, 4]:
                    sucesso_pote = self._alocar_pote(num_pote, grupos_atualizados)
                    if not sucesso_pote:
                        raise ValueError(f"Impossível alocar Pote {num_pote}")

                SorteioLogger.log_fim_sorteio(grupos_atualizados)
                return grupos_atualizados

            except ValueError as e:
                SorteioLogger.log_erro(f"Reiniciando sorteio global: {str(e)}")
                continue

        raise Exception("Erro Crítico.")

    def _alocar_pote(self, num_pote, grupos):
        times_pote = self.potes[num_pote].copy()
        tentativas_locais = 0
        max_tentativas_locais = 500

        while tentativas_locais < max_tentativas_locais:
            tentativas_locais += 1
            backup_grupos = {g: list(v) for g, v in grupos.items()}
            
            random.shuffle(times_pote)
            times_ordenados = sorted(
                times_pote, 
                key=lambda t: sum(1 for x in times_pote if x["confederacao"] == t["confederacao"]),
                reverse=True
            )
            
            conflito = False
            eventos_locais = [] # Salva os passos dessa tentativa
            
            for time in times_ordenados:
                validos = [
                    g for g in self.nomes_grupos 
                    if len(grupos[g]) == (num_pote - 1) and self.pode_adicionar_time(time, grupos[g])
                ]
                
                todos_pendentes = [
                    g for g in self.nomes_grupos 
                    if len(grupos[g]) == (num_pote - 1)
                ]
                
                if validos:
                    grupo_sel = validos[0]
                    grupo_idx = self.nomes_grupos.index(grupo_sel)
                    slot_numero = self.SLOTS_POTES[num_pote][grupo_idx]
                    
                    if todos_pendentes and grupo_sel != todos_pendentes[0]:
                        idx_esperado = todos_pendentes.index(grupo_sel)
                        for i in range(idx_esperado):
                            grupo_pulado = todos_pendentes[i]
                            if (grupo_pulado, num_pote) not in self.grupos_pulados:
                                self.grupos_pulados.append((grupo_pulado, num_pote))
                                idx_pulado = self.nomes_grupos.index(grupo_pulado)
                                slot_pulado = self.SLOTS_POTES[num_pote][idx_pulado]
                                eventos_locais.append({"isPulo": True, "pote": num_pote, "grupo": grupo_pulado, "slotNumber": slot_pulado, "time": time})
                                SorteioLogger.log_conflito(time['nome'], time['confederacao'], grupo_pulado)
                    
                    time["slotNumber"] = slot_numero  # Armazena o slot técnico no time
                    grupos[grupo_sel].append(time)
                    eventos_locais.append({"isPulo": False, "pote": num_pote, "grupo": grupo_sel, "slotNumber": slot_numero, "time": time})
                    SorteioLogger.log_alocacao(time['nome'], grupo_sel, num_pote, time['confederacao'])
                else:
                    conflito = True
                    break
            
            if not conflito:
                self.eventos_sorteio.extend(eventos_locais) # Consolida a linha do tempo se der sucesso!
                return True
            
            for g in self.nomes_grupos:
                grupos[g] = list(backup_grupos[g])
                
        return False

    def formatar_resultado(self, grupos):
        resultado = {}
        for nome_grupo, times in grupos.items():
            # Reorganiza times conforme a distribuição técnica da FIFA
            times_reorganizados = [None] * 4  # Array com 4 slots (índices 0-3)
            
            for time in times:
                pote = time.get("pote", 0)
                if pote in self.SLOTS_TECNICOS_MAP[nome_grupo]:
                    idx_tecnico = self.SLOTS_TECNICOS_MAP[nome_grupo][pote]
                    slot_numero = self.SLOTS_POTES[pote][self.nomes_grupos.index(nome_grupo)]
                    time["slot"] = f"{nome_grupo}{slot_numero}"  # Ex: A1, B4, C2
                    times_reorganizados[idx_tecnico] = time
            
            # Cria placeholders para slots vazios (ainda não preenchidos)
            for idx in range(4):
                if times_reorganizados[idx] is None:
                    # Descobre qual pote deveria estar aqui
                    pote_para_este_slot = None
                    for p, idx_esperado in self.SLOTS_TECNICOS_MAP[nome_grupo].items():
                        if idx_esperado == idx:
                            pote_para_este_slot = p
                            break
                    times_reorganizados[idx] = {
                        "id": f"{nome_grupo}_POT{pote_para_este_slot}",
                        "nome": f"POT {pote_para_este_slot}",
                        "sigla": "",
                        "confederacao": "",
                        "pote": pote_para_este_slot,
                        "rank": 0,
                        "is_placeholder": True,
                        "slot": f"{nome_grupo}{[1,2,3,4][idx]}"
                    }
            
            resultado[nome_grupo] = {
                "times": times_reorganizados,
                "total": 4
            }
        
        # 🟢 NOVO: Envia o roteiro completo pro Frontend
        resultado["_metadata"] = {
            "grupos_pulados": self.grupos_pulados,
            "total_pulado": len(self.grupos_pulados),
            "eventos": getattr(self, 'eventos_sorteio', []) 
        }
        
        return resultado

def fazer_sorteio(pais_sede="USA", potes_customizados=None):
    manager = SorteioManager(potes_customizados)
    grupos = manager.sortear(pais_sede, potes_customizados)
    return manager.formatar_resultado(grupos)