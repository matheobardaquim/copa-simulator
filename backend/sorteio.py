import json
import random
from pathlib import Path
from logger_sorteio import SorteioLogger

class SorteioManager:
    def __init__(self, potes_customizados=None):
        # ANTES: Path(__file__).parent.parent (ia para a raiz)
        # AGORA: Path(__file__).parent (fica em backend/)
        data_path = Path(__file__).parent / "data" / "teams.json"
        
        try:
            with open(data_path, "r", encoding="utf-8") as f:
                self.todos_times = json.load(f)
        except FileNotFoundError:
            # Dica de Tech Lead: Logue o erro para não ficar no escuro
            print(f"❌ SorteioManager não achou o JSON em: {data_path}")
            raise
        
        # Usar potes customizados ou padrão
        if potes_customizados:
            self.potes = potes_customizados
        else:
            self.potes = self._criar_potes_padrao()
        
        # Inicializar 12 grupos
        self.grupos = {chr(65 + i): [] for i in range(12)}  # A-L
        self.nomes_grupos = ['A', 'B', 'C', 'D', 'E', 'F', 'G', 'H', 'I', 'J', 'K', 'L']
    
    def _criar_potes_padrao(self):
        """Cria potes padrão baseado no JSON"""
        potes = {}
        for i in range(1, 5):
            potes[i] = [t for t in self.todos_times if t["pote"] == i]
        return potes
    
    def pode_adicionar_time(self, time, grupo_times):
        """
        Verifica se um time pode ser adicionado a um grupo.
        Regras:
        - Nenhuma confederação (exceto UEFA) pode ter mais de 1 representante
        - UEFA pode ter no máximo 2 representantes
        """
        confederacao = time["confederacao"]
        
        # Contar quantos times dessa confederação já estão no grupo
        count_confederacao = sum(1 for t in grupo_times if t["confederacao"] == confederacao)
        
        if confederacao == "UEFA":
            # UEFA permite até 2
            return count_confederacao < 2
        else:
            # Outras confederações permitem apenas 1
            return count_confederacao == 0
    
    def encontrar_grupos_disponiveis(self, time, grupos_atualizados, pote_atual):
        """
        Encontra todos os grupos disponíveis para alocar um time.
        """
        confederacao = time["confederacao"]
        grupos_validos = []
        
        for grupo_nome in self.nomes_grupos:
            # Verificar se grupo já tem um time deste pote
            ja_tem_pote = any(t["pote"] == pote_atual for t in grupos_atualizados[grupo_nome])
            if ja_tem_pote:
                continue
            
            # Verificar restrições de confederação
            if self.pode_adicionar_time(time, grupos_atualizados[grupo_nome]):
                grupos_validos.append(grupo_nome)
        
        return grupos_validos
    
    def sortear(self, pais_sede="Estados Unidos", potes_customizados=None):
        if potes_customizados:
            self.potes = potes_customizados
        
        SorteioLogger.log_inicio_sorteio(pais_sede, len(self.potes))
        
        # Inicializa grupos A-L vazios
        grupos_atualizados = {chr(65 + i): [] for i in range(12)}
        
        # 1. ALOCAR ANFITRIÕES (Pote 1)
        times_pote1 = self.potes[1].copy()
        hosts_config = {"México": "A", "Canadá": "B", "Estados Unidos": "D"}
        
        for nome_host, grupo_alvo in hosts_config.items():
            # Busca flexível que aceita "USA", "EUA" ou "Estados Unidos"
            host_obj = next((t for t in times_pote1 if nome_host.lower() in t["nome"].lower() or (nome_host == "Estados Unidos" and "usa" in t["nome"].lower())), None)
            if host_obj:
                grupos_atualizados[grupo_alvo].append(host_obj)
                times_pote1.remove(host_obj)
                SorteioLogger.log_alocacao(host_obj["nome"], grupo_alvo, 1, host_obj["confederacao"])

        # 2. DISTRIBUIR RESTO DO POTE 1
        random.shuffle(times_pote1)
        for grupo_nome in self.nomes_grupos:
            if not grupos_atualizados[grupo_nome] and times_pote1:
                time = times_pote1.pop(0)
                grupos_atualizados[grupo_nome].append(time)
                SorteioLogger.log_alocacao(time["nome"], grupo_nome, 1, time["confederacao"])

        # 3. POTES 2, 3, 4 - Lógica de Retry com Blindagem de Contagem
        for num_pote in [2, 3, 4]:
            tentativas = 0
            sucesso_pote = False
            
            while not sucesso_pote and tentativas < 100:
                tentativas += 1
                backup_estado = {k: list(v) for k, v in grupos_atualizados.items()}
                times_pote = self.potes[num_pote].copy()
                random.shuffle(times_pote)
                
                conflito_no_pote = False
                for time in times_pote:
                    # FILTRO CRÍTICO: Só aceita grupos que tenham EXATAMENTE num_pote - 1 times
                    # Isso impede que um grupo fique com 5 e outro com 3
                    grupos_validos = [
                        g for g in self.nomes_grupos 
                        if len(grupos_atualizados[g]) == (num_pote - 1) and 
                        self.pode_adicionar_time(time, grupos_atualizados[g])
                    ]
                    
                    if grupos_validos:
                        grupo_sel = random.choice(grupos_validos)
                        grupos_atualizados[grupo_sel].append(time)
                        SorteioLogger.log_alocacao(time["nome"], grupo_sel, num_pote, time["confederacao"])
                    else:
                        conflito_no_pote = True
                        break
                
                if not conflito_no_pote:
                    sucesso_pote = True
                else:
                    grupos_atualizados = backup_estado
            
            if not sucesso_pote:
                raise Exception(f"Erro: Não foi possível equilibrar o Pote {num_pote}. Tente refazer os potes.")

        SorteioLogger.log_fim_sorteio(grupos_atualizados)
        return grupos_atualizados
    
    def _validar_e_corrigir_grupos(self, grupos):
        """
        Valida se cada grupo tem 4 times.
        Se não, faz uma redistribuição forçada para garantir 4 times por grupo.
        """
        SorteioLogger.log_erro("Iniciando validação e correção de grupos")
        
        # Primeiro, identificar grupos com menos de 4 times
        grupos_faltando = []
        grupos_completos = []
        
        for grupo_nome, times in grupos.items():
            if len(times) < 4:
                grupos_faltando.append((grupo_nome, len(times)))
            elif len(times) == 4:
                grupos_completos.append(grupo_nome)
        
        SorteioLogger.log_erro(f"Grupos completos: {len(grupos_completos)}, Grupos faltando: {grupos_faltando}")
        
        if not grupos_faltando:
            SorteioLogger.log_erro("Todos os grupos estão completos")
            return  # Todos os grupos estão completos
        
        SorteioLogger.log_erro(f"Grupos incompletos detectados: {grupos_faltando}")
        
        # Para cada grupo faltando, tentar encontrar times para mover
        for grupo_faltando, num_times in grupos_faltando:
            times_faltando = 4 - num_times
            
            SorteioLogger.log_erro(f"Corrigindo grupo {grupo_faltando} que precisa de {times_faltando} times")
            
            # Procurar times em grupos completos que podem ser movidos
            for _ in range(times_faltando):
                time_movido = None
                grupo_origem = None
                
                # Tentar mover times de grupos completos
                for grupo_comp in grupos_completos:
                    if len(grupos[grupo_comp]) >= 1:  # Tem pelo menos 1 time
                        for time in grupos[grupo_comp][:]:  # Copiar a lista para evitar problemas
                            # Verificar se pode adicionar ao grupo faltando
                            if self.pode_adicionar_time(time, grupos[grupo_faltando]):
                                time_movido = time
                                grupo_origem = grupo_comp
                                break
                        if time_movido:
                            break
                
                if time_movido:
                    # Mover o time
                    grupos[grupo_origem].remove(time_movido)
                    grupos[grupo_faltando].append(time_movido)
                    SorteioLogger.log_redistribuicao(
                        time_movido["nome"], grupo_origem, grupo_faltando
                    )
                    SorteioLogger.log_erro(f"Movido {time_movido['nome']} de {grupo_origem} para {grupo_faltando} (respeitando regras)")
                else:
                    # Se não conseguiu mover respeitando regras, forçar movimento
                    SorteioLogger.log_erro(f"Forçando movimento para grupo {grupo_faltando}")
                    # Pegar qualquer time de qualquer grupo completo
                    for grupo_comp in grupos_completos:
                        if grupos[grupo_comp]:  # Se tem times
                            time_movido = grupos[grupo_comp].pop(0)  # Remover o primeiro
                            grupo_origem = grupo_comp
                            grupos[grupo_faltando].append(time_movido)
                            SorteioLogger.log_redistribuicao(
                                time_movido["nome"], grupo_origem, grupo_faltando
                            )
                            SorteioLogger.log_erro(f"Forçado movimento de {time_movido['nome']} de {grupo_origem} para {grupo_faltando}")
                            break
        
        # Verificar novamente se todos os grupos têm 4 times
        for grupo_nome, times in grupos.items():
            if len(times) != 4:
                SorteioLogger.log_erro(
                    f"ERRO CRÍTICO: Grupo {grupo_nome} ainda tem {len(times)} times após correção!"
                )
            else:
                SorteioLogger.log_erro(f"Grupo {grupo_nome} agora tem {len(times)} times")
    
    def formatar_resultado(self, grupos):
        """Formata o resultado do sorteio de forma legível."""
        resultado = {}
        for nome_grupo, times in grupos.items():
            resultado[nome_grupo] = {
                "times": times,
                "total": len(times)
            }
        return resultado


def fazer_sorteio(pais_sede="USA", potes_customizados=None):
    """Função auxiliar para fazer o sorteio"""
    manager = SorteioManager(potes_customizados)
    grupos = manager.sortear(pais_sede, potes_customizados)
    return manager.formatar_resultado(grupos)
