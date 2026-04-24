from PIL import Image, ImageDraw, ImageFont
import io

def gerar_imagem_grupos(grupos):
    # 1. CONFIGURAÇÕES DE PALETA E DIMENSÕES
    largura = 1200
    altura = 2350  # Aumentado para não "comer" os últimos grupos
    cor_fundo_profundo = (0, 8, 20)      
    cor_dourada = (251, 191, 36)         
    cor_card = (22, 38, 70)              
    cor_slot_time = (30, 50, 85) # Cor escura sólida para contraste com texto branco
    
    cores_conf = {
        'UEFA': (59, 91, 219), 'CONMEBOL': (251, 191, 36), 
        'CONCACAF': (34, 139, 34), 'AFC': (231, 76, 60), 
        'CAF': (243, 156, 18), 'OFC': (26, 188, 156)
    }

    img = Image.new('RGBA', (largura, altura), color=cor_fundo_profundo)
    draw = ImageDraw.Draw(img)

    # 2. EFEITO DE LUZ NO TOPO
    for i in range(800):
        alpha = int(255 * (1 - i/800) * 0.3)
        draw.ellipse([largura//2 - i, -i, largura//2 + i, i], outline=(30, 58, 138, alpha))

    # 3. CARREGAMENTO DE FONTES
    try:
        fonte_titulo = ImageFont.truetype("arial.ttf", 65)
        fonte_sub = ImageFont.truetype("arial.ttf", 28)
        fonte_grupo_tit = ImageFont.truetype("arial.ttf", 35)
        fonte_time = ImageFont.truetype("arial.ttf", 26)
        fonte_badge = ImageFont.truetype("arial.ttf", 16)
    except:
        fonte_titulo = fonte_sub = fonte_grupo_tit = fonte_time = fonte_badge = ImageFont.load_default()

    # 4. CABEÇALHO
    draw.text((largura//2, 100), "SORTEIO FINALIZADO", fill=cor_dourada, font=fonte_titulo, anchor="ms")
    draw.text((largura//2, 160), "FIFA World Cup 2026 - Grupos Oficiais", fill=(165, 180, 252), font=fonte_sub, anchor="ms")

    # 5. GRADE DE GRUPOS
    margem_x, margem_y = 60, 250
    espaco_x, espaco_y = 360, 480
    larg_card, alt_card = 340, 440
    
    nomes_grupos = ['A', 'B', 'C', 'D', 'E', 'F', 'G', 'H', 'I', 'J', 'K', 'L']

    for i, nome_g in enumerate(nomes_grupos):
        col, lin = i % 3, i // 3
        x, y = margem_x + (col * espaco_x), margem_y + (lin * espaco_y)

        # Card do Grupo
        draw.rounded_rectangle([x, y, x+larg_card, y+alt_card], radius=20, fill=cor_card, outline=(255,255,255,40), width=1)
        draw.text((x + larg_card//2, y + 50), f"GRUPO {nome_g}", fill=cor_dourada, font=fonte_grupo_tit, anchor="ms")
        draw.line([x + 60, y + 75, x + larg_card - 60, y + 75], fill=cor_dourada, width=2)

        # Times
        times = grupos.get(nome_g, {}).get('times', [])
        for idx, time in enumerate(times):
            y_time = y + 120 + (idx * 80)
            
            # Slot do Time (Cor corrigida para permitir leitura)
            draw.rounded_rectangle([x+20, y_time, x+larg_card-20, y_time+65], radius=10, fill=cor_slot_time)
            
            # Número
            draw.ellipse([x+35, y_time+17, x+65, y_time+47], fill=cor_dourada)
            draw.text((x+50, y_time+32), str(idx+1), fill=(0,0,0), font=fonte_time, anchor="mm")
            
            # Nome do Time (Agora visível)
            draw.text((x+80, y_time+32), time['nome'][:18], fill=(255,255,255), font=fonte_time, anchor="lm")
            
            # Badge de Confederação
            conf = time['confederacao']
            cor_b = cores_conf.get(conf, (150,150,150))
            draw.rounded_rectangle([x+larg_card-85, y_time+22, x+larg_card-30, y_time+43], radius=5, fill=cor_b)
            draw.text((x+larg_card-57, y_time+32), conf[:3], fill=(0,0,0), font=fonte_badge, anchor="mm")

    # 6. RODAPÉ
    draw.text((largura//2, altura - 80), "Gerado por Simulador Matheo Lira - Copa 2026", fill=(100, 116, 139), font=fonte_badge, anchor="ms")

    # Finalização
    img_final = img.convert('RGB')
    img_byte_arr = io.BytesIO()
    img_final.save(img_byte_arr, format='PNG', optimize=True)
    img_byte_arr.seek(0)
    return img_byte_arr