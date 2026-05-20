import os
from datetime import datetime, timedelta
from dotenv import load_dotenv
from flask import Flask, render_template, request, session, jsonify, redirect, url_for
from flask_sqlalchemy import SQLAlchemy
from werkzeug.security import generate_password_hash, check_password_hash
from werkzeug.utils import secure_filename
from sqlalchemy import text

load_dotenv()

app = Flask(__name__)
app.secret_key = os.getenv('SECRET_KEY', 'cyberforce_2026_key')
app.config['PERMANENT_SESSION_LIFETIME'] = timedelta(hours=8)

# Configurações de Upload do Eric
UPLOAD_FOLDER = os.path.join('static', 'uploads', 'perfil')
app.config['UPLOAD_FOLDER'] = UPLOAD_FOLDER
app.config['MAX_CONTENT_LENGTH'] = 2 * 1024 * 1024
os.makedirs(UPLOAD_FOLDER, exist_ok=True)

app.config['SQLALCHEMY_DATABASE_URI'] = (
    f"mysql+pymysql://{os.getenv('DB_USER')}:{os.getenv('DB_PASSWORD')}"
    f"@{os.getenv('DB_HOST')}/{os.getenv('DB_NAME')}"
)
app.config['SQLALCHEMY_TRACK_MODIFICATIONS'] = False

db = SQLAlchemy(app)

# ─── MODELOS DE BANCO DE DADOS ───

class Usuario(db.Model):
    __tablename__ = 'Usuario'
    id_usuario = db.Column(db.Integer, primary_key=True)
    nome = db.Column(db.String(100), nullable=False)
    email = db.Column(db.String(100), unique=True, nullable=False)
    senha = db.Column(db.String(255), nullable=False)
    cpf = db.Column(db.String(14), unique=True, nullable=False)
    perfil = db.Column(db.Enum('aluno', 'treinador', 'admin'), default='aluno')
    data_nascimento = db.Column(db.Date, nullable=False)
    # Alterações do Eric mantidas para o sistema de perfil dele funcionar
    genero = db.Column(db.String(20))   
    peso = db.Column(db.Numeric(5, 2)) 
    altura = db.Column(db.Integer)    
    foto_perfil = db.Column(db.String(255), default='default_avatar.png') 

class Aluno(db.Model):
    __tablename__ = 'Aluno'
    id_aluno = db.Column(db.Integer, primary_key=True)
    id_usuario = db.Column(db.Integer, db.ForeignKey('Usuario.id_usuario'), nullable=False)
    objetivo = db.Column(db.String(100))

class Treino(db.Model):
    __tablename__ = 'Treino'
    id_treino    = db.Column(db.Integer, primary_key=True)
    id_aluno     = db.Column(db.Integer, db.ForeignKey('Aluno.id_aluno'), nullable=False)
    nome_treino  = db.Column(db.String(50), nullable=False) # PUSH, PULL, LEGS
    data_criacao = db.Column(db.DateTime, default=datetime.utcnow)

class ItemTreino(db.Model):
    __tablename__ = 'Item_Treino'
    id_item_treino = db.Column(db.Integer, primary_key=True)
    id_treino      = db.Column(db.Integer, db.ForeignKey('Treino.id_treino'), nullable=False)
    nome_exercicio = db.Column(db.String(100))
    series         = db.Column(db.Integer)
    repeticoes     = db.Column(db.Integer)
    carga          = db.Column(db.Float)

class Produto(db.Model):
    __tablename__ = 'Produto'
    id_produto = db.Column(db.Integer, primary_key=True)
    nome = db.Column(db.String(100), nullable=False)
    marca = db.Column(db.String(100))
    categoria = db.Column(db.String(50), nullable=False)
    preco = db.Column(db.String(20))
    status = db.Column(db.String(20), default='available')
    icone = db.Column(db.String(10))
    quantidade = db.Column(db.Integer, default=0)


# ─── ROTAS DE PÁGINAS (FRONTEND) ───

@app.before_request
def renovar_sessao():
    if 'usuario_id' in session:
        session.permanent = True
        session.modified = True

@app.route('/')
def index():
    return render_template('home.html')

@app.route('/estoque')
def estoque():
    return render_template('store.html')

@app.route('/programacao')
def programacao():
    return render_template('schedule.html')

@app.route('/perfil')
def perfil():
    if 'usuario_id' not in session:
        return redirect(url_for('login'))
    return render_template('perfil.html')

@app.route('/logbook')
def logbook():
    if 'usuario_id' not in session:
        return redirect(url_for('login'))
    return render_template('logbook.html')

@app.route('/painel_professor')
def professor_painel():
    if session.get('perfil') not in ['treinador', 'admin']:
        return redirect(url_for('index'))
    return render_template('painel_professor.html')


# ─── ROTAS DE AUTENTICAÇÃO ───

@app.route('/login', methods=['GET', 'POST'])
def login():
    if 'usuario_id' in session:
        return redirect(url_for('index'))

    if request.method == 'POST':
        data = request.get_json()
        usuario = Usuario.query.filter_by(email=data.get('email')).first()
        
        if usuario and check_password_hash(usuario.senha, data.get('senha')):
            session.permanent = True
            session['usuario_id'] = usuario.id_usuario
            session['perfil'] = usuario.perfil
            session['nome'] = usuario.nome
            session['email'] = usuario.email
            # Mantive a sua resposta completa que o layout do header precisa
            return jsonify({'sucesso': True, 'perfil': usuario.perfil, 'nome': usuario.nome, 'email': usuario.email})
            
        return jsonify({'sucesso': False, 'mensagem': 'CREDENCIAIS_INVÁLIDAS'}), 401
        
    return render_template('login.html')

@app.route('/logout')
def logout():
    session.clear() 
    return redirect(url_for('index'))

@app.route('/cadastro', methods=['POST'])
def cadastro():
    data = request.get_json()
    
    campos_obrigatorios = ['nome', 'email', 'senha', 'cpf', 'data_nascimento']
    if not all(data.get(c) for c in campos_obrigatorios):
        return jsonify({'sucesso': False, 'mensagem': 'DADOS_INCOMPLETOS'}), 400

    try:
        if Usuario.query.filter_by(email=data.get('email')).first():
            return jsonify({'sucesso': False, 'mensagem': 'EMAIL_JÁ_REGISTRADO'}), 400
        if Usuario.query.filter_by(cpf=data.get('cpf')).first():
            return jsonify({'sucesso': False, 'mensagem': 'CPF_JÁ_REGISTRADO'}), 400
        
        data_nasc_texto = data.get('data_nascimento')
        data_nasc_mysql = datetime.strptime(data_nasc_texto, '%d/%m/%Y').date()

        novo_usuario = Usuario(
            nome=data.get('nome'),
            email=data.get('email'),
            senha=generate_password_hash(data.get('senha')),
            cpf=data.get('cpf'),
            perfil='aluno',
            data_nascimento=data_nasc_mysql,
            genero=data.get('genero'),
            peso=data.get('peso'),
            altura=data.get('altura')
        )
        db.session.add(novo_usuario)
        db.session.flush()

        novo_aluno = Aluno(id_usuario=novo_usuario.id_usuario)
        db.session.add(novo_aluno)
        
        db.session.commit()
        return jsonify({'sucesso': True})
        
    except ValueError:
        db.session.rollback()
        return jsonify({'sucesso': False, 'mensagem': 'FORMATO_DE_DATA_INVÁLIDO (Use DD/MM/AAAA)'}), 400
    except Exception as e:
        db.session.rollback()
        return jsonify({'sucesso': False, 'mensagem': 'ERRO NO BANCO DE DADOS'}), 500


# ─── ROTAS DE API: PROFESSOR, TREINOS E VÍNCULOS (CÓDIGO DO ERIC) ───

@app.route('/api/professor/buscar_aluno/<termo>')
def buscar_aluno(termo):
    if session.get('perfil') not in ['treinador', 'admin']: return jsonify({'erro': 'Acesso negado'}), 403
    query = f"%{termo}%"
    alunos = Usuario.query.filter(
        Usuario.perfil == 'aluno',
        (Usuario.nome.like(query)) | (Usuario.id_usuario == termo if termo.isdigit() else False)
    ).all()
    return jsonify([{'id': a.id_usuario, 'nome': a.nome, 'email': a.email} for a in alunos])

@app.route('/api/professor/vincular_aluno', methods=['POST'])
def vincular_aluno():
    if session.get('perfil') not in ['treinador', 'admin']: return jsonify({'erro': 'Acesso negado'}), 403
    dados = request.json
    try:
        sql = text("INSERT INTO vinculo_professor_aluno (id_professor, id_aluno) VALUES (:prof, :aluno)")
        db.session.execute(sql, {"prof": session.get('usuario_id'), "aluno": dados.get('id_aluno')})
        db.session.commit()
        return jsonify({"sucesso": True, "mensagem": "Aluno recrutado!"})
    except Exception as e:
        db.session.rollback()
        return jsonify({"sucesso": False, "mensagem": "Aluno já está vinculado ou erro no banco."}), 400

@app.route('/api/professor/meus_alunos')
def meus_alunos():
    if session.get('perfil') not in ['treinador', 'admin']: return jsonify([]), 403
    sql = text("""
        SELECT u.id_usuario as id_aluno, u.nome 
        FROM Usuario u
        JOIN vinculo_professor_aluno v ON u.id_usuario = v.id_aluno
        WHERE v.id_professor = :prof AND u.perfil = 'aluno'
    """)
    resultado = db.session.execute(sql, {"prof": session.get('usuario_id')})
    return jsonify([{'id_aluno': r.id_aluno, 'nome': r.nome} for r in resultado])

@app.route('/api/professor/todos_alunos')
def todos_alunos():
    if session.get('perfil') not in ['treinador', 'admin']: return jsonify([]), 403
    alunos = Usuario.query.filter_by(perfil='aluno').all()
    return jsonify([{'id': a.id_usuario, 'nome': a.nome, 'email': a.email} for a in alunos])

@app.route('/api/professor/desvincular_aluno/<int:id_aluno>', methods=['DELETE'])
def prof_desvincular_aluno(id_aluno):
    if session.get('perfil') not in ['treinador', 'admin']: return jsonify({'erro': 'Acesso negado'}), 403
    prof_id = session.get('usuario_id')
    sql = text("DELETE FROM vinculo_professor_aluno WHERE id_professor = :prof AND id_aluno = :aluno")
    db.session.execute(sql, {"prof": prof_id, "aluno": id_aluno})
    db.session.commit()
    return jsonify({"sucesso": True, "mensagem": "Vínculo removido!"})

@app.route('/api/professor/ver_treino/<int:id_aluno_user>/<categoria>')
def prof_ver_treino(id_aluno_user, categoria):
    try:
        if session.get('perfil') not in ['treinador', 'admin']: return jsonify({"erro": "Acesso negado"}), 403
        aluno = Aluno.query.filter_by(id_usuario=id_aluno_user).first()
        if not aluno: return jsonify({"exercicios": []})
        treino = Treino.query.filter_by(id_aluno=aluno.id_aluno, nome_treino=categoria.upper()).first()
        if not treino: return jsonify({"exercicios": []})
        exercicios = [{"nome": e.nome_exercicio, "series": e.series, "reps": e.repeticoes, "carga": e.carga} for e in ItemTreino.query.filter_by(id_treino=treino.id_treino).all()]
        return jsonify({"exercicios": exercicios})
    except Exception as e:
        return jsonify({"erro": str(e)}), 500

@app.route('/api/professor/salvar_treino', methods=['POST'])
def salvar_treino():
    try:
        if session.get('perfil') not in ['treinador', 'admin']: return jsonify({"sucesso": False, "mensagem": "Não autorizado"}), 403
        dados = request.json
        id_aluno_user = dados.get('id_aluno')
        categoria = dados.get('categoria', '').upper()
        
        sql_check = text("SELECT id_professor FROM vinculo_professor_aluno WHERE id_aluno = :aluno ORDER BY data_vinculo ASC LIMIT 1")
        primeiro_prof = db.session.execute(sql_check, {"aluno": id_aluno_user}).fetchone()
        if primeiro_prof and primeiro_prof[0] != session.get('usuario_id'):
            return jsonify({"sucesso": False, "mensagem": "ACESSO NEGADO: Este aluno já possui um treinador."}), 403

        aluno_registro = Aluno.query.filter_by(id_usuario=id_aluno_user).first()
        if not aluno_registro:
            aluno_registro = Aluno(id_usuario=id_aluno_user)
            db.session.add(aluno_registro)
            db.session.commit()

        treino_antigo = Treino.query.filter_by(id_aluno=aluno_registro.id_aluno, nome_treino=categoria).first()
        if treino_antigo:
            ItemTreino.query.filter_by(id_treino=treino_antigo.id_treino).delete()
            db.session.delete(treino_antigo)
            db.session.commit()
        
        novo_treino = Treino(id_aluno=aluno_registro.id_aluno, nome_treino=categoria)
        db.session.add(novo_treino)
        db.session.commit()

        for ex in dados.get('exercicios', []):
            nome_ex = ex.get('nome', '').strip()
            if not nome_ex: continue
            db.session.add(ItemTreino(
                id_treino=novo_treino.id_treino, 
                nome_exercicio=nome_ex, 
                series=int(ex.get('series') or 0), 
                repeticoes=int(ex.get('reps') or 0), 
                carga=float(ex.get('carga') or 0)
            ))
        db.session.commit()
        return jsonify({"sucesso": True, "mensagem": "Treino atualizado com sucesso!"})
    except Exception as e:
        db.session.rollback()
        return jsonify({"sucesso": False, "mensagem": f"Erro no banco: {str(e)}"}), 500

@app.route('/api/aluno/meu_treino/<categoria>', methods=['GET'])
def meu_treino(categoria):
    usuario_id = session.get('usuario_id')
    aluno = Aluno.query.filter_by(id_usuario=usuario_id).first()
    if not aluno:
        aluno = Aluno(id_usuario=usuario_id)
        db.session.add(aluno)
        db.session.commit()
        
    treino = Treino.query.filter_by(id_aluno=aluno.id_aluno, nome_treino=categoria.upper()).first()
    if not treino: return jsonify({"mensagem": "// NENHUM PROTOCOLO ENCONTRADO."}), 404
        
    exercicios = [{"id_item": e.id_item_treino, "nome": e.nome_exercicio, "series": e.series, "reps": e.repeticoes, "carga": e.carga} for e in ItemTreino.query.filter_by(id_treino=treino.id_treino).all()]
    return jsonify({"treino_id": treino.id_treino, "categoria": treino.nome_treino, "exercicios": exercicios})

@app.route('/api/treino/atualizar_carga', methods=['POST'])
def atualizar_carga():
    dados = request.json
    item = ItemTreino.query.get(dados['id_item_treino'])
    if item:
        item.carga = dados['nova_carga']
        db.session.commit()
    return jsonify({'sucesso': True})

@app.route('/api/admin/conexoes')
def admin_conexoes():
    if session.get('perfil') != 'admin': return jsonify([]), 403
    sql = text("""
        SELECT v.id_vinculo, p.nome as professor, a.nome as aluno 
        FROM vinculo_professor_aluno v
        JOIN Usuario p ON v.id_professor = p.id_usuario
        JOIN Usuario a ON v.id_aluno = a.id_usuario
    """)
    res = db.session.execute(sql).fetchall()
    return jsonify([dict(r._mapping) for r in res])

@app.route('/api/conexao/remover/<int:id_vinculo>', methods=['DELETE'])
def remover_conexao(id_vinculo):
    user_id = session.get('usuario_id')
    perfil = session.get('perfil')
    vinculo = db.session.execute(text("SELECT id_aluno FROM vinculo_professor_aluno WHERE id_vinculo = :id"), {"id": id_vinculo}).fetchone()
    if not vinculo: return jsonify({"erro": "Vínculo não encontrado"}), 404
    if perfil == 'admin' or user_id == vinculo[0]:
        db.session.execute(text("DELETE FROM vinculo_professor_aluno WHERE id_vinculo = :id"), {"id": id_vinculo})
        db.session.commit()
        return jsonify({"sucesso": True})
    return jsonify({"erro": "Você não tem permissão para desvincular"}), 403

@app.route('/admin/promover/<int:usuario_id>', methods=['POST'])
def promover_para_professor(usuario_id):
    if session.get('perfil') != 'admin':
        return "Acesso negado", 403
        
    usuario = Usuario.query.get(usuario_id)
    if usuario:
        usuario.perfil = 'treinador'
        db.session.commit()
        return f"Usuário {usuario.nome} agora é Professor!"
    return "Usuário não encontrado", 404


# ─── ROTAS DE API: PERFIL E UPLOAD DE IMAGEM ───

@app.route('/api/usuario/perfil', methods=['GET'])
def buscar_perfil():
    if 'usuario_id' not in session: return jsonify({"erro": "Não autorizado"}), 401
    usuario = Usuario.query.get(session['usuario_id'])
    aluno = Aluno.query.filter_by(id_usuario=usuario.id_usuario).first()
    return jsonify({
        "nome": usuario.nome, "email": usuario.email, "cpf": usuario.cpf,
        "data_nascimento": usuario.data_nascimento.strftime('%Y-%m-%d') if usuario.data_nascimento else "",
        "genero": usuario.genero, "peso": float(usuario.peso) if usuario.peso else 0,
        "altura": usuario.altura, "objetivo": aluno.objetivo if aluno else "",
        "foto_url": f"/static/uploads/perfil/{usuario.foto_perfil}"
    })

@app.route('/api/usuario/atualizar_completo', methods=['POST'])
def atualizar_perfil_completo():
    if 'usuario_id' not in session: return jsonify({"sucesso": False, "mensagem": "Não autorizado"}), 401
    usuario = Usuario.query.get(session['usuario_id'])
    senha_confirmacao = request.form.get('senha_confirmacao')
    
    if not senha_confirmacao or not check_password_hash(usuario.senha, senha_confirmacao):
        return jsonify({"sucesso": False, "mensagem": "Senha incorreta."}), 403

    try:
        if 'foto' in request.files:
            file = request.files['foto']
            if file and '.' in file.filename and file.filename.rsplit('.', 1)[1].lower() in {'png', 'jpg', 'jpeg', 'gif'}:
                filename = secure_filename(f"{usuario.id_usuario}_{file.filename}")
                file.save(os.path.join(app.config['UPLOAD_FOLDER'], filename))
                usuario.foto_perfil = filename

        usuario.nome = request.form.get('nome')
        usuario.cpf = request.form.get('cpf')
        usuario.email = request.form.get('email')
        usuario.genero = request.form.get('genero')
        if request.form.get('data_nascimento'): 
            usuario.data_nascimento = datetime.strptime(request.form.get('data_nascimento'), '%Y-%m-%d').date()
        usuario.peso = float(request.form.get('peso')) if request.form.get('peso') else None
        usuario.altura = int(request.form.get('altura')) if request.form.get('altura') else None
        
        aluno = Aluno.query.filter_by(id_usuario=usuario.id_usuario).first()
        if aluno and request.form.get('objetivo'): 
            aluno.objetivo = request.form.get('objetivo')

        db.session.commit()
        session['nome'] = usuario.nome
        return jsonify({"sucesso": True, "mensagem": "Perfil atualizado!"})
    except Exception as e:
        db.session.rollback()
        return jsonify({"sucesso": False, "mensagem": "Erro interno no servidor."}), 500

@app.route('/api/usuario/excluir', methods=['POST'])
def excluir_conta():
    if 'usuario_id' not in session: return jsonify({"sucesso": False}), 401
    usuario = Usuario.query.get(session['usuario_id'])
    if usuario:
        try:
            aluno = Aluno.query.filter_by(id_usuario=usuario.id_usuario).first()
            if aluno:
                treinos = Treino.query.filter_by(id_aluno=aluno.id_aluno).all()
                for t in treinos:
                    ItemTreino.query.filter_by(id_treino=t.id_treino).delete()
                    db.session.delete(t)
                db.session.delete(aluno)
            db.session.delete(usuario)
            db.session.commit()
            session.clear()
            return jsonify({"sucesso": True})
        except Exception as e:
            db.session.rollback()
            return jsonify({"sucesso": False, "erro": str(e)}), 500
    return jsonify({"sucesso": False}), 404

# ─── ROTAS DO ESTOQUE (CRUD LUIGI) ───

@app.route('/api/produtos', methods=['GET'])
def listar_produtos():
    produtos = Produto.query.all()
    lista = []
    for p in produtos:
        lista.append({
            "id": p.id_produto, "name": p.nome, "brand": p.marca, 
            "cat": p.categoria, "price": p.preco, "status": p.status, 
            "icon": p.icone, "quantity": p.quantidade
        })
    return jsonify(lista)

@app.route('/api/produtos', methods=['POST'])
def criar_produto():
    if session.get('perfil') not in ['admin', 'treinador']:
        return jsonify({"sucesso": False, "mensagem": "Acesso Negado"}), 403
        
    data = request.get_json()
    try:
        novo = Produto(
            nome=data.get('name'), marca=data.get('brand'), categoria=data.get('cat'),
            preco=data.get('price'), status=data.get('status'), icone=data.get('icon'),
            quantidade=data.get('quantity')
        )
        db.session.add(novo)
        db.session.commit()
        return jsonify({"sucesso": True, "mensagem": "Produto adicionado!"})
    except Exception as e:
        db.session.rollback()
        return jsonify({"sucesso": False, "mensagem": str(e)}), 500

@app.route('/api/produtos/<int:id_produto>/quantidade', methods=['PUT'])
def alterar_quantidade(id_produto):
    if session.get('perfil') not in ['admin', 'treinador']:
        return jsonify({"sucesso": False}), 403
    
    data = request.get_json()
    produto = Produto.query.get(id_produto)
    
    if produto:
        produto.quantidade = data.get('quantity')
        produto.status = 'out' if produto.quantidade <= 0 else 'available'
        db.session.commit()
        return jsonify({"sucesso": True})
        
    return jsonify({"sucesso": False}), 404

@app.route('/api/produtos/<int:id_produto>', methods=['DELETE'])
def deletar_produto(id_produto):
    if session.get('perfil') not in ['admin', 'treinador']:
        return jsonify({"sucesso": False, "mensagem": "Acesso Negado"}), 403
        
    produto = Produto.query.get(id_produto)
    if produto:
        db.session.delete(produto)
        db.session.commit()
        return jsonify({"sucesso": True})
    return jsonify({"sucesso": False, "mensagem": "Produto não encontrado"}), 404


if __name__ == '__main__':
    with app.app_context():
        db.create_all()
    app.run(debug=True)