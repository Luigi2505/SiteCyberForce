from flask import Flask, render_template, request, session, jsonify
from flask_sqlalchemy import SQLAlchemy
from dotenv import load_dotenv
from werkzeug.security import generate_password_hash, check_password_hash
import os

load_dotenv()

app = Flask(__name__)
app.secret_key = os.getenv('SECRET_KEY', 'cyberforce_neural_key_99')

# Configuração do Banco de Dados
app.config['SQLALCHEMY_DATABASE_URI'] = (
    f"mysql+pymysql://{os.getenv('DB_USER')}:{os.getenv('DB_PASSWORD')}"
    f"@{os.getenv('DB_HOST')}/{os.getenv('DB_NAME')}"
)
app.config['SQLALCHEMY_TRACK_MODIFICATIONS'] = False

db = SQLAlchemy(app)

# MODELO DE USUÁRIO ATUALIZADO
class Usuario(db.Model):
    __tablename__ = 'Usuario'
    id_usuario      = db.Column(db.Integer, primary_key=True)
    nome            = db.Column(db.String(100), nullable=False)
    email           = db.Column(db.String(100), unique=True, nullable=False)
    senha           = db.Column(db.String(255), nullable=False)
    perfil          = db.Column(db.Enum('aluno', 'treinador', 'admin'), default='aluno')
    cpf             = db.Column(db.String(14), unique=True)
    celular         = db.Column(db.String(15))
    data_nascimento = db.Column(db.String(10))
    logradouro      = db.Column(db.String(150))
    bairro          = db.Column(db.String(80))
    cidade          = db.Column(db.String(80))
    uf              = db.Column(db.String(2))
    cep             = db.Column(db.String(9))

@app.route('/')
def index():
    return render_template('index.html')

@app.route('/login', methods=['GET', 'POST'])
def login():
    if request.method == 'POST':
        data = request.get_json()
        usuario = Usuario.query.filter_by(email=data.get('email')).first()
        if usuario and check_password_hash(usuario.senha, data.get('senha')):
            session['usuario_id'] = usuario.id_usuario
            return jsonify({'sucesso': True})
        return jsonify({'sucesso': False, 'mensagem': 'Credenciais Inválidas'}), 401
    return render_template('login.html')

@app.route('/cadastro', methods=['POST'])
def cadastro():
    data = request.get_json()
    if Usuario.query.filter_by(email=data.get('email')).first():
        return jsonify({'sucesso': False, 'mensagem': 'EMAIL_JÁ_CADASTRADO'}), 400
    
    try:
        # CRIPTOGRAFIA DA SENHA
        senha_hash = generate_password_hash(data.get('senha'))
        
        novo = Usuario(
            nome=data.get('nome'),
            email=data.get('email'),
            senha=senha_hash,
            cpf=data.get('cpf'),
            celular=data.get('celular'),
            data_nascimento=data.get('data_nascimento'),
            cep=data.get('cep'),
            logradouro=data.get('logradouro'),
            bairro=data.get('bairro'),
            cidade=data.get('cidade'),
            uf=data.get('uf')
        )
        db.session.add(novo)
        db.session.commit()
        return jsonify({'sucesso': True})
    except Exception as e:
        db.session.rollback()
        return jsonify({'sucesso': False, 'mensagem': str(e)}), 500

if __name__ == '__main__':
    app.run(debug=True)